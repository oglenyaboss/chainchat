async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

interface MineRequest {
  transactions: unknown[]
  previousHash: string
  index: number
  difficulty: number
  timestamp: number
}

let mining = false

self.onmessage = async (e: MessageEvent) => {
  const data = e.data as MineRequest | { type: 'stop' }

  if ('type' in data && data.type === 'stop') {
    mining = false
    return
  }

  const req = data as MineRequest
  mining = true
  let nonce = 0
  const target = '0'.repeat(req.difficulty)
  const startTime = performance.now()

  while (mining) {
    const blockData = `${req.index}:${req.timestamp}:${JSON.stringify(req.transactions)}:${req.previousHash}:${nonce}`
    const hash = await sha256(blockData)

    if (hash.startsWith(target)) {
      self.postMessage({
        type: 'result',
        block: {
          index: req.index,
          timestamp: req.timestamp,
          transactions: req.transactions,
          previousHash: req.previousHash,
          nonce,
          hash,
        },
      })
      mining = false
      return
    }

    nonce++

    if (nonce % 1000 === 0) {
      const elapsed = (performance.now() - startTime) / 1000
      const hashrate = Math.round(nonce / elapsed)
      self.postMessage({ type: 'progress', hashrate, nonce })
    }
  }
}
