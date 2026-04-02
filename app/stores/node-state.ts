import { defineStore } from 'pinia'

export type NodeState = 'INIT' | 'CONNECTING' | 'SYNCING' | 'READY' | 'MINING'

export const useNodeStateStore = defineStore('node-state', () => {
  const state = ref<NodeState>('INIT')
  const syncProgress = ref(0)
  const error = ref<string | null>(null)
  const isMining = ref(false)
  const hashrate = ref(0)
  const currentNonce = ref(0)
  const orphanPoolSize = ref(0)
  const chainReplacedAt = ref<number | null>(null)

  function setState(newState: NodeState) {
    state.value = newState
  }

  function setSyncProgress(progress: number) {
    syncProgress.value = progress
  }

  function setError(err: string | null) {
    error.value = err
  }

  function setMiningInfo(mining: boolean, rate: number = 0, nonce: number = 0) {
    isMining.value = mining
    hashrate.value = rate
    currentNonce.value = nonce
  }

  function setOrphanPoolSize(size: number) {
    orphanPoolSize.value = size
  }

  function markChainReplaced() {
    chainReplacedAt.value = Date.now()
  }

  return {
    state,
    syncProgress,
    error,
    isMining,
    hashrate,
    currentNonce,
    orphanPoolSize,
    chainReplacedAt,
    setState,
    setSyncProgress,
    setError,
    setMiningInfo,
    setOrphanPoolSize,
    markChainReplaced,
  }
})
