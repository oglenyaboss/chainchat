/**
 * LRU-based seen set for deduplicating blocks and transactions.
 * Uses a Set with FIFO eviction when capacity is reached.
 */

const DEFAULT_CAPACITY = 10_000

export interface SeenSet {
  readonly size: number
  hasSeen: (id: string) => boolean
  markSeen: (id: string) => void
  clear: () => void
}

export function createSeenSet(capacity: number = DEFAULT_CAPACITY): SeenSet {
  const seen = new Set<string>()
  const order: string[] = []

  return {
    get size() {
      return seen.size
    },

    hasSeen(id: string): boolean {
      return seen.has(id)
    },

    markSeen(id: string): void {
      if (seen.has(id))
        return

      if (seen.size >= capacity) {
        const oldest = order.shift()
        if (oldest !== undefined) {
          seen.delete(oldest)
        }
      }

      seen.add(id)
      order.push(id)
    },

    clear(): void {
      seen.clear()
      order.length = 0
    },
  }
}

export function createBlockSeenSet(): SeenSet {
  return createSeenSet(5_000)
}

export function createTransactionSeenSet(): SeenSet {
  return createSeenSet(DEFAULT_CAPACITY)
}
