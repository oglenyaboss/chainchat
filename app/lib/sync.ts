import type { Block } from './blockchain'
import { validateChain } from './blockchain'
import { shouldReplaceChain } from './fork-resolution'

export type SyncPhase = 'idle' | 'collecting-heads' | 'downloading-blocks' | 'complete'

export interface SyncState {
  readonly phase: SyncPhase
  readonly progress: number // 0-1
  readonly bestPeer: string | null
  readonly bestIndex: number
  readonly bestHash: string
}

export interface ChainHeadInfo {
  readonly peerId: string
  readonly index: number
  readonly hash: string
}

const HEAD_COLLECTION_TIMEOUT_MS = 5_000

export interface SyncCoordinator {
  readonly state: SyncState
  startSync: (peerIds: readonly string[], localChainLength: number) => void
  handleChainHeadResponse: (peerId: string, index: number, hash: string) => void
  handleBlocksResponse: (blocks: readonly Block[], totalLength: number) => {
    progress: number
    complete: boolean
    chain: readonly Block[] | null
  }
  getBestPeer: () => string | null
  reset: () => void
  isTimedOut: () => boolean
}

export function createSyncCoordinator(): SyncCoordinator {
  let state: SyncState = {
    phase: 'idle',
    progress: 0,
    bestPeer: null,
    bestIndex: 0,
    bestHash: '',
  }

  let collectedHeads: ChainHeadInfo[] = []
  let expectedPeerCount = 0
  let syncStartTime = 0
  let localLength = 0
  let accumulatedBlocks: Block[] = []

  return {
    get state(): SyncState {
      return state
    },

    startSync(peerIds: readonly string[], localChainLength: number): void {
      collectedHeads = []
      expectedPeerCount = peerIds.length
      syncStartTime = Date.now()
      localLength = localChainLength
      accumulatedBlocks = []

      state = {
        phase: expectedPeerCount > 0 ? 'collecting-heads' : 'complete',
        progress: 0,
        bestPeer: null,
        bestIndex: 0,
        bestHash: '',
      }
    },

    handleChainHeadResponse(peerId: string, index: number, hash: string): void {
      if (state.phase !== 'collecting-heads')
        return

      collectedHeads = [...collectedHeads, { peerId, index, hash }]

      // Pick the peer with the longest chain (tiebreak: smaller hash)
      let best = collectedHeads[0]!
      for (const head of collectedHeads) {
        if (head.index > best.index || (head.index === best.index && head.hash < best.hash)) {
          best = head
        }
      }

      state = {
        ...state,
        bestPeer: best.peerId,
        bestIndex: best.index,
        bestHash: best.hash,
        progress: collectedHeads.length / expectedPeerCount,
      }

      // If all peers responded or best is clearly ahead, move to download phase
      if (collectedHeads.length >= expectedPeerCount) {
        if (best.index >= localLength) {
          state = { ...state, phase: 'downloading-blocks' }
        }
        else {
          state = { ...state, phase: 'complete' }
        }
      }
    },

    handleBlocksResponse(
      blocks: readonly Block[],
      totalLength: number,
    ): { progress: number, complete: boolean, chain: readonly Block[] | null } {
      if (state.phase !== 'downloading-blocks') {
        return { progress: 1, complete: true, chain: null }
      }

      accumulatedBlocks = [...accumulatedBlocks, ...blocks]
      const progress = totalLength > 0 ? accumulatedBlocks.length / totalLength : 1
      const complete = accumulatedBlocks.length >= totalLength

      state = {
        ...state,
        progress,
      }

      if (complete) {
        state = { ...state, phase: 'complete' }
        return { progress: 1, complete: true, chain: accumulatedBlocks }
      }

      return { progress, complete: false, chain: null }
    },

    getBestPeer(): string | null {
      return state.bestPeer
    },

    reset(): void {
      state = {
        phase: 'idle',
        progress: 0,
        bestPeer: null,
        bestIndex: 0,
        bestHash: '',
      }
      collectedHeads = []
      accumulatedBlocks = []
      expectedPeerCount = 0
      syncStartTime = 0
      localLength = 0
    },

    isTimedOut(): boolean {
      if (state.phase !== 'collecting-heads')
        return false
      return Date.now() - syncStartTime > HEAD_COLLECTION_TIMEOUT_MS
    },
  }
}

/**
 * Validate a candidate chain and decide if it should replace the current one.
 */
export async function evaluateCandidateChain(
  currentChain: readonly Block[],
  candidateChain: readonly Block[],
): Promise<boolean> {
  if (!shouldReplaceChain(currentChain, candidateChain)) {
    return false
  }
  return validateChain(candidateChain)
}
