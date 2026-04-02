import { defineStore } from 'pinia'
import type { Block, Transaction } from '~/lib/blockchain'
import {
  createGenesisBlock,
  validateBlock,
  validateChain,
  adjustDifficulty,
  DIFFICULTY_ADJUSTMENT_INTERVAL,
} from '~/lib/blockchain'
import { shouldReplaceChain } from '~/lib/fork-resolution'
import { buildNameRegistry, validateNameRegistration } from '~/lib/name-registry'
import type { OrphanPool } from '~/lib/orphan-pool'

export const useBlockchainStore = defineStore('blockchain-v2', () => {
  const chain = ref<Block[]>([createGenesisBlock()])
  const pendingTransactions = ref<Transaction[]>([])
  const difficulty = ref(3)

  const latestBlock = computed(() => chain.value[chain.value.length - 1]!)
  const allTransactions = computed(() =>
    chain.value.flatMap(block => block.transactions),
  )
  const blockCount = computed(() => chain.value.length)
  const nameRegistry = computed(() => buildNameRegistry(chain.value))

  function addPendingTransaction(tx: Transaction) {
    const exists = pendingTransactions.value.some(t => t.id === tx.id)
    if (!exists) {
      pendingTransactions.value = [...pendingTransactions.value, tx]
    }
  }

  function removePendingTransactions(ids: Set<string>) {
    pendingTransactions.value = pendingTransactions.value.filter(tx => !ids.has(tx.id))
  }

  async function addBlock(block: Block): Promise<boolean> {
    const valid = await validateBlock(block, latestBlock.value)
    if (!valid) return false

    // Validate name registration transactions
    for (const tx of block.transactions) {
      if (tx.type === 'register-name') {
        const error = validateNameRegistration(chain.value, tx.message, tx.from)
        if (error) return false
      }
    }

    chain.value = [...chain.value, block]
    const minedIds = new Set(block.transactions.map(tx => tx.id))
    pendingTransactions.value = pendingTransactions.value.filter(tx => !minedIds.has(tx.id))

    // Adjust difficulty every N blocks
    if (block.index > 0 && block.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0) {
      difficulty.value = adjustDifficulty(chain.value, difficulty.value)
    }

    return true
  }

  /**
   * Add a block and recursively process any orphans that depend on it.
   * Returns all blocks that were successfully added.
   */
  async function addBlockWithOrphans(block: Block, orphanPool: OrphanPool): Promise<Block[]> {
    const added = await addBlock(block)
    if (!added) return []

    const addedBlocks: Block[] = [block]

    // Check orphan pool for blocks that were waiting for this block
    const orphans = orphanPool.getByParentHash(block.hash)
    if (orphans.length > 0) {
      orphanPool.removeByParentHash(block.hash)
      for (const orphan of orphans) {
        const recursivelyAdded = await addBlockWithOrphans(orphan, orphanPool)
        addedBlocks.push(...recursivelyAdded)
      }
    }

    return addedBlocks
  }

  /**
   * Replace chain using deterministic fork resolution.
   * Longer chain wins; equal-length chains use lexicographic hash tiebreak.
   */
  async function replaceChainIfBetter(newChain: Block[]): Promise<boolean> {
    if (!shouldReplaceChain(chain.value, newChain)) return false
    const valid = await validateChain(newChain)
    if (!valid) return false

    chain.value = [...newChain]
    return true
  }

  /** @deprecated Use replaceChainIfBetter for deterministic fork resolution */
  async function replaceChain(newChain: Block[]): Promise<boolean> {
    return replaceChainIfBetter(newChain)
  }

  function getTransactionsForAddress(publicKey: string): Transaction[] {
    return allTransactions.value.filter(
      tx => tx.from === publicKey || tx.to === publicKey || tx.to === 'broadcast',
    )
  }

  function getNameForKey(publicKey: string): string | null {
    for (const entry of nameRegistry.value.values()) {
      if (entry.publicKey === publicKey) return entry.name
    }
    return null
  }

  function isNameTaken(name: string): boolean {
    return nameRegistry.value.has(name.toLowerCase())
  }

  return {
    chain,
    pendingTransactions,
    difficulty,
    latestBlock,
    allTransactions,
    blockCount,
    nameRegistry,
    addPendingTransaction,
    removePendingTransactions,
    addBlock,
    addBlockWithOrphans,
    replaceChain,
    replaceChainIfBetter,
    getTransactionsForAddress,
    getNameForKey,
    isNameTaken,
  }
},
{
  persist: {
    storage: piniaPluginPersistedstate.localStorage(),
    pick: ['chain', 'difficulty'],
  },
})
