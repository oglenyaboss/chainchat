import type { Block, Transaction } from '~/lib/blockchain'
import type { PeerMessage } from '~/lib/protocol'
import type { NodeState } from '~/stores/node-state'
import { createTransaction, MAX_TRANSACTIONS_PER_BLOCK } from '~/lib/blockchain'
import { createBlockSeenSet, createTransactionSeenSet } from '~/lib/deduplication'
import { hasRegisteredName, isValidNameFormat } from '~/lib/name-registry'
import { createOrphanPool } from '~/lib/orphan-pool'
import { createSyncCoordinator } from '~/lib/sync'

// Valid state transitions
const TRANSITIONS: Record<NodeState, readonly NodeState[]> = {
  INIT: ['CONNECTING'],
  CONNECTING: ['SYNCING', 'READY'],
  SYNCING: ['READY'],
  READY: ['MINING', 'SYNCING'],
  MINING: ['READY', 'SYNCING'],
} as const

const MINING_BATCH_DELAY_MS = 10_000
const ORPHAN_CLEANUP_INTERVAL_MS = 30_000
const SYNC_TIMEOUT_CHECK_MS = 1_000
const SOLO_MODE_TIMEOUT_MS = 10_000

export function useNodeStateMachine() {
  const identityStore = useIdentityStore()
  const blockchainStore = useBlockchainStore()
  const peerStore = usePeerStore()
  const chatStore = useChatStore()
  const nodeStateStore = useNodeStateStore()
  const cryptoUtils = useCrypto()
  const mining = useMining()

  const blockSeenSet = createBlockSeenSet()
  const txSeenSet = createTransactionSeenSet()
  const orphanPool = createOrphanPool()
  const syncCoordinator = createSyncCoordinator()

  let orphanCleanupTimer: ReturnType<typeof setInterval> | null = null
  let syncTimeoutTimer: ReturnType<typeof setInterval> | null = null
  let miningScheduleTimer: ReturnType<typeof setTimeout> | null = null
  let miningLoopActive = false
  let stopped = false

  // --- WebRTC & Signaling ---

  const webrtc = useWebRTC({
    onMessage: handlePeerMessage,
    onChannelReady: handleChannelReady,
    onPeerDisconnected: handlePeerDisconnected,
  })

  const signaling = useSignaling({
    onPeerList(peerIds) {
      for (const pid of peerIds) {
        webrtc.connectToPeer(pid, signaling.sendSignal)
      }
    },
    onSignal(from, signal) {
      webrtc.handleSignal(from, signal, signaling.sendSignal)
    },
    onPeerLeft(peerId) {
      webrtc.removePeer(peerId)
      peerStore.removePeer(peerId)
    },
  })

  // --- State transitions ---

  function transitionTo(newState: NodeState) {
    const current = nodeStateStore.state
    const allowed = TRANSITIONS[current]

    if (!allowed.includes(newState)) {
      return
    }

    nodeStateStore.setState(newState)
    onEnterState(newState)
  }

  function onEnterState(state: NodeState) {
    switch (state) {
      case 'CONNECTING':
        enterConnecting()
        break
      case 'SYNCING':
        enterSyncing()
        break
      case 'READY':
        enterReady()
        break
      case 'MINING':
        enterMining()
        break
    }
  }

  // --- State enter handlers ---

  function enterConnecting() {
    signaling.connectRelay(identityStore.peerId)

    // Solo mode timeout — if no peers connect within 10s, go to READY
    setTimeout(() => {
      if (nodeStateStore.state === 'CONNECTING') {
        transitionTo('READY')
      }
    }, SOLO_MODE_TIMEOUT_MS)
  }

  function enterSyncing() {
    const peerIds = webrtc.getConnectedPeerIds()
    syncCoordinator.startSync(peerIds, blockchainStore.chain.length)
    nodeStateStore.setSyncProgress(0)

    if (peerIds.length === 0) {
      // No peers — skip sync
      transitionTo('READY')
      return
    }

    // Request chain heads from all peers
    for (const peerId of peerIds) {
      webrtc.sendToPeer(peerId, { type: 'request-chain-head' })
    }

    // Timeout checker for head collection
    syncTimeoutTimer = setInterval(() => {
      if (syncCoordinator.isTimedOut()) {
        clearSyncTimer()
        const bestPeer = syncCoordinator.getBestPeer()
        if (bestPeer && syncCoordinator.state.bestIndex >= blockchainStore.chain.length) {
          // Got at least some responses — request blocks from best peer
          syncCoordinator.handleChainHeadResponse('__timeout__', 0, '')
          webrtc.sendToPeer(bestPeer, { type: 'request-blocks', fromIndex: 0 })
        }
        else {
          transitionTo('READY')
        }
      }
    }, SYNC_TIMEOUT_CHECK_MS)
  }

  let chainLoaded = false

  function enterReady() {
    syncCoordinator.reset()
    clearSyncTimer()
    nodeStateStore.setSyncProgress(1)
    nodeStateStore.setMiningInfo(false)

    // Reconstruct chat from blockchain on first READY (after sync)
    if (!chainLoaded) {
      chainLoaded = true
      chatStore.loadFromChain(
        blockchainStore.chain,
        resolveNickname,
        async (tx) => {
          if (tx.to === identityStore.publicKey) {
            try {
              return await cryptoUtils.decrypt(identityStore.privateKey, tx.from, tx.message)
            }
            catch {
              return '[unable to decrypt]'
            }
          }
          if (tx.from === identityStore.publicKey) {
            try {
              return await cryptoUtils.decrypt(identityStore.privateKey, tx.to, tx.message)
            }
            catch {
              return '[unable to decrypt]'
            }
          }
          return '[encrypted]'
        },
      )
    }

    // Auto-register name on first READY
    tryAutoRegisterName()

    // Check if there are pending transactions to mine
    if (blockchainStore.pendingTransactions.length > 0) {
      scheduleMining()
    }
  }

  function enterMining() {
    // Guard against re-entrant mining. The state machine already prevents
    // MINING → MINING transitions, but this flag adds defense-in-depth.
    if (miningLoopActive)
      return
    miningLoopActive = true
    runMiningCycle()
  }

  // --- Mining ---

  async function runMiningCycle() {
    if (stopped || nodeStateStore.state !== 'MINING') {
      miningLoopActive = false
      return
    }

    if (blockchainStore.pendingTransactions.length === 0) {
      miningLoopActive = false
      transitionTo('READY')
      return
    }

    try {
      const txBatch = [...blockchainStore.pendingTransactions].slice(0, MAX_TRANSACTIONS_PER_BLOCK)
      const block = await mining.startMining(
        txBatch,
        blockchainStore.latestBlock.hash,
        blockchainStore.latestBlock.index + 1,
        blockchainStore.difficulty,
      )

      const addedBlocks = await blockchainStore.addBlockWithOrphans(block, orphanPool)
      nodeStateStore.setOrphanPoolSize(orphanPool.size)

      if (addedBlocks.length > 0) {
        for (const addedBlock of addedBlocks) {
          blockSeenSet.markSeen(addedBlock.hash)
          for (const tx of addedBlock.transactions) {
            chatStore.confirmMessage(tx.id, addedBlock.index)
          }
        }
        webrtc.broadcast({ type: 'new-block', block })
      }
      else {
        // Block was rejected — drop the invalid txs from pending to prevent infinite loop
        const failedIds = new Set(txBatch.map(tx => tx.id))
        blockchainStore.removePendingTransactions(failedIds)
      }
    }
    catch {
      // Mining interrupted (new block received) — this is expected
    }

    miningLoopActive = false

    // Transition back to READY, which will re-check pending tx
    if (nodeStateStore.state === 'MINING') {
      transitionTo('READY')
    }
  }

  function scheduleMining() {
    // Debounce: only one pending schedule at a time
    if (miningScheduleTimer)
      return
    miningScheduleTimer = setTimeout(() => {
      miningScheduleTimer = null
      if (nodeStateStore.state === 'READY' && blockchainStore.pendingTransactions.length > 0) {
        transitionTo('MINING')
      }
    }, MINING_BATCH_DELAY_MS)
  }

  // --- Message handling ---

  function handlePeerMessage(peerId: string, msg: PeerMessage) {
    switch (msg.type) {
      case 'hello':
        handleHello(peerId, msg)
        break
      case 'new-transaction':
        handleNewTransaction(peerId, msg.transaction)
        break
      case 'new-block':
        handleNewBlock(peerId, msg.block)
        break
      case 'request-chain':
        webrtc.sendToPeer(peerId, { type: 'chain-response', chain: [...blockchainStore.chain] })
        break
      case 'chain-response':
        handleChainResponse(msg.chain)
        break
      case 'peer-list':
        for (const p of msg.peers) {
          if (p.peerId !== identityStore.peerId) {
            peerStore.addPeer(p)
          }
        }
        break
      case 'request-chain-head':
        webrtc.sendToPeer(peerId, {
          type: 'chain-head-response',
          index: blockchainStore.latestBlock.index,
          hash: blockchainStore.latestBlock.hash,
        })
        break
      case 'chain-head-response':
        handleChainHeadResponse(peerId, msg.index, msg.hash)
        break
      case 'request-blocks':
        handleRequestBlocks(peerId, msg.fromIndex)
        break
      case 'blocks-response':
        handleBlocksResponse(msg.blocks, msg.totalLength)
        break
      case 'ping':
        webrtc.sendToPeer(peerId, { type: 'pong' })
        break
      case 'pong':
        break
    }
  }

  function handleHello(
    _peerId: string,
    msg: { peerId: string, publicKey: string, nickname: string },
  ) {
    peerStore.addPeer({ peerId: msg.peerId, publicKey: msg.publicKey, nickname: msg.nickname })

    // If we're still connecting and got our first peer, move to syncing
    if (nodeStateStore.state === 'CONNECTING') {
      transitionTo('SYNCING')
    }
  }

  function handleChannelReady(peerId: string) {
    // Send hello as soon as channel is open instead of setTimeout
    webrtc.sendToPeer(peerId, {
      type: 'hello',
      peerId: identityStore.peerId,
      publicKey: identityStore.publicKey,
      nickname: identityStore.nickname,
    })
  }

  function handlePeerDisconnected(peerId: string) {
    peerStore.removePeer(peerId)
  }

  function handleNewTransaction(_peerId: string, tx: Transaction) {
    if (txSeenSet.hasSeen(tx.id))
      return
    txSeenSet.markSeen(tx.id)

    blockchainStore.addPendingTransaction(tx)
    processIncomingTransaction(tx)

    // If we're READY, schedule mining
    if (nodeStateStore.state === 'READY') {
      scheduleMining()
    }
  }

  async function handleNewBlock(_peerId: string, block: Block) {
    if (blockSeenSet.hasSeen(block.hash))
      return
    blockSeenSet.markSeen(block.hash)

    // Try to add the block directly
    const addedBlocks = await blockchainStore.addBlockWithOrphans(block, orphanPool)
    nodeStateStore.setOrphanPoolSize(orphanPool.size)

    if (addedBlocks.length > 0) {
      // Block accepted — confirm messages and interrupt mining
      for (const addedBlock of addedBlocks) {
        for (const tx of addedBlock.transactions) {
          chatStore.confirmMessage(tx.id, addedBlock.index)
        }
      }

      if (nodeStateStore.state === 'MINING') {
        mining.stopMining()
      }

      // Re-broadcast to other peers
      webrtc.broadcast({ type: 'new-block', block })
    }
    else {
      // Block didn't attach — might be orphan (parent unknown)
      // Check if parent hash doesn't match our chain tip
      if (block.previousHash !== blockchainStore.latestBlock.hash) {
        orphanPool.add(block)
        nodeStateStore.setOrphanPoolSize(orphanPool.size)

        // Request full chain from the sender to resolve the fork
        if (nodeStateStore.state !== 'SYNCING') {
          transitionTo('SYNCING')
        }
      }
    }
  }

  async function handleChainResponse(chain: Block[]) {
    const replaced = await blockchainStore.replaceChainIfBetter(chain)
    if (replaced) {
      nodeStateStore.markChainReplaced()

      if (nodeStateStore.state === 'MINING') {
        mining.stopMining()
      }
    }

    if (nodeStateStore.state === 'SYNCING') {
      transitionTo('READY')
    }
  }

  function handleChainHeadResponse(peerId: string, index: number, hash: string) {
    syncCoordinator.handleChainHeadResponse(peerId, index, hash)
    nodeStateStore.setSyncProgress(syncCoordinator.state.progress * 0.5) // First half: collecting heads

    if (syncCoordinator.state.phase === 'downloading-blocks') {
      clearSyncTimer()
      const bestPeer = syncCoordinator.getBestPeer()
      if (bestPeer) {
        webrtc.sendToPeer(bestPeer, { type: 'request-blocks', fromIndex: 0 })
      }
    }
    else if (syncCoordinator.state.phase === 'complete') {
      clearSyncTimer()
      transitionTo('READY')
    }
  }

  function handleRequestBlocks(peerId: string, fromIndex: number) {
    const blocks = blockchainStore.chain.slice(fromIndex)
    webrtc.sendToPeer(peerId, {
      type: 'blocks-response',
      blocks: [...blocks],
      totalLength: blockchainStore.chain.length,
    })
  }

  async function handleBlocksResponse(blocks: Block[], totalLength: number) {
    const result = syncCoordinator.handleBlocksResponse(blocks, totalLength)
    nodeStateStore.setSyncProgress(0.5 + result.progress * 0.5) // Second half: downloading

    if (result.complete && result.chain) {
      const replaced = await blockchainStore.replaceChainIfBetter([...result.chain])
      if (replaced) {
        nodeStateStore.markChainReplaced()
      }
      syncCoordinator.reset()
      transitionTo('READY')
    }
  }

  // --- Transaction processing ---

  function resolveNickname(publicKey: string): string {
    // Prefer on-chain name
    const onChainName = blockchainStore.getNameForKey(publicKey)
    if (onChainName)
      return onChainName
    // Fallback: local identity
    if (publicKey === identityStore.publicKey)
      return identityStore.nickname
    // Fallback: peer nickname
    const peer = peerStore.peerList.find(p => p.publicKey === publicKey)
    return peer?.nickname ?? `${publicKey.slice(0, 12)}...`
  }

  async function processIncomingTransaction(tx: Transaction) {
    // Skip system transactions (name registrations)
    if (tx.to === '__system__')
      return

    let content = tx.message
    if (tx.to === identityStore.publicKey) {
      try {
        content = await cryptoUtils.decrypt(identityStore.privateKey, tx.from, tx.message)
      }
      catch {
        content = '[unable to decrypt]'
      }
    }

    chatStore.addMessage({
      id: tx.id,
      from: tx.from,
      fromNickname: resolveNickname(tx.from),
      to: tx.to,
      content,
      timestamp: tx.timestamp,
      blockIndex: null,
    })
  }

  // --- Name registration ---

  let nameRegistrationPending = false

  async function registerName(name: string): Promise<void> {
    if (nameRegistrationPending)
      return
    if (hasRegisteredName(blockchainStore.chain, identityStore.publicKey))
      return

    nameRegistrationPending = true

    const tx = await createTransaction(
      'register-name',
      identityStore.publicKey,
      '__system__',
      name,
      identityStore.privateKey,
    )

    txSeenSet.markSeen(tx.id)
    blockchainStore.addPendingTransaction(tx)
    webrtc.broadcast({ type: 'new-transaction', transaction: tx })

    if (nodeStateStore.state === 'READY') {
      scheduleMining()
    }
  }

  function tryAutoRegisterName() {
    if (!identityStore.nickname)
      return
    if (hasRegisteredName(blockchainStore.chain, identityStore.publicKey))
      return
    if (!isValidNameFormat(identityStore.nickname))
      return
    registerName(identityStore.nickname)
  }

  // --- Public API ---

  async function sendMessage(text: string): Promise<void> {
    const to = chatStore.activeChannel
    let messageContent = text

    if (to !== 'broadcast') {
      messageContent = await cryptoUtils.encrypt(identityStore.privateKey, to, text)
    }

    const tx = await createTransaction(
      'message',
      identityStore.publicKey,
      to,
      messageContent,
      identityStore.privateKey,
    )

    txSeenSet.markSeen(tx.id)
    blockchainStore.addPendingTransaction(tx)
    chatStore.addMessage({
      id: tx.id,
      from: identityStore.publicKey,
      fromNickname: resolveNickname(identityStore.publicKey),
      to,
      content: text,
      timestamp: tx.timestamp,
      blockIndex: null,
    })

    webrtc.broadcast({ type: 'new-transaction', transaction: tx })

    // Schedule mining if we're ready
    if (nodeStateStore.state === 'READY') {
      scheduleMining()
    }
  }

  function start() {
    stopped = false
    nodeStateStore.setState('INIT')
    nodeStateStore.setError(null)

    // Start orphan pool cleanup
    orphanCleanupTimer = setInterval(() => {
      orphanPool.cleanup()
      nodeStateStore.setOrphanPoolSize(orphanPool.size)
    }, ORPHAN_CLEANUP_INTERVAL_MS)

    // Mining state tracking — sync mining composable state to node store
    watch(
      [mining.isMining, mining.hashrate, mining.currentNonce],
      ([m, h, n]) => {
        nodeStateStore.setMiningInfo(m, h, n)
      },
    )

    // Watch pending transactions for auto-mining trigger
    watch(
      () => blockchainStore.pendingTransactions.length,
      (count) => {
        if (count > 0 && nodeStateStore.state === 'READY') {
          scheduleMining()
        }
      },
    )

    // Transition: INIT → CONNECTING
    transitionTo('CONNECTING')
  }

  function stop() {
    stopped = true
    mining.stopMining()
    miningLoopActive = false
    webrtc.disconnectAll()
    signaling.disconnect()
    clearSyncTimer()

    if (miningScheduleTimer) {
      clearTimeout(miningScheduleTimer)
      miningScheduleTimer = null
    }

    if (orphanCleanupTimer) {
      clearInterval(orphanCleanupTimer)
      orphanCleanupTimer = null
    }

    blockSeenSet.clear()
    txSeenSet.clear()
    orphanPool.clear()
    syncCoordinator.reset()
  }

  function clearSyncTimer() {
    if (syncTimeoutTimer) {
      clearInterval(syncTimeoutTimer)
      syncTimeoutTimer = null
    }
  }

  return {
    sendMessage,
    registerName,
    start,
    stop,
    webrtc,
    signaling,
    mining,
  }
}
