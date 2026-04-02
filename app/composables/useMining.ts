import type { Block, Transaction } from '~/lib/blockchain'

export function useMining() {
  const worker = ref<Worker | null>(null)
  const isMining = ref(false)
  const hashrate = ref(0)
  const currentNonce = ref(0)
  let rejectCurrent: (() => void) | null = null

  function startMining(
    transactions: Transaction[],
    previousHash: string,
    index: number,
    difficulty: number,
  ): Promise<Block> {
    return new Promise((resolve, reject) => {
      const miner = new Worker(
        new URL('../workers/miner.worker.ts', import.meta.url),
        { type: 'module' },
      )

      worker.value = miner
      isMining.value = true
      hashrate.value = 0
      currentNonce.value = 0
      rejectCurrent = () => reject(new Error('Mining interrupted'))

      miner.onerror = (e) => {
        isMining.value = false
        worker.value = null
        rejectCurrent = null
        reject(new Error(e.message))
      }

      miner.onmessage = (e: MessageEvent) => {
        const data = e.data
        if (data.type === 'progress') {
          hashrate.value = data.hashrate
          currentNonce.value = data.nonce
        }
        else if (data.type === 'result') {
          isMining.value = false
          worker.value = null
          rejectCurrent = null
          resolve(data.block as Block)
        }
      }

      miner.postMessage(JSON.parse(JSON.stringify({
        transactions,
        previousHash,
        index,
        difficulty,
        timestamp: Date.now(),
      })))
    })
  }

  function stopMining() {
    if (worker.value) {
      worker.value.postMessage({ type: 'stop' })
      worker.value.terminate()
      worker.value = null
      isMining.value = false
      hashrate.value = 0
    }
    if (rejectCurrent) {
      rejectCurrent()
      rejectCurrent = null
    }
  }

  return { isMining, hashrate, currentNonce, startMining, stopMining }
}
