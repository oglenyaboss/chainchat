import type { Block } from './blockchain'

interface OrphanEntry {
  readonly block: Block
  readonly addedAt: number
}

const DEFAULT_TTL_MS = 60_000
const DEFAULT_MAX_SIZE = 100

export interface OrphanPool {
  readonly size: number
  add(block: Block): void
  getByParentHash(parentHash: string): readonly Block[]
  removeByParentHash(parentHash: string): void
  cleanup(ttlMs?: number): number
  clear(): void
}

export function createOrphanPool(maxSize: number = DEFAULT_MAX_SIZE): OrphanPool {
  const entries = new Map<string, OrphanEntry[]>()
  let totalSize = 0

  function evictOldest(): void {
    let oldestTime = Infinity
    let oldestKey = ''
    let oldestIdx = 0

    for (const [key, list] of entries) {
      for (let i = 0; i < list.length; i++) {
        if (list[i]!.addedAt < oldestTime) {
          oldestTime = list[i]!.addedAt
          oldestKey = key
          oldestIdx = i
        }
      }
    }

    if (oldestKey) {
      const list = entries.get(oldestKey)!
      list.splice(oldestIdx, 1)
      if (list.length === 0) {
        entries.delete(oldestKey)
      }
      totalSize--
    }
  }

  return {
    get size() {
      return totalSize
    },

    add(block: Block): void {
      if (totalSize >= maxSize) {
        evictOldest()
      }

      const key = block.previousHash
      const existing = entries.get(key) ?? []
      const alreadyExists = existing.some(e => e.block.hash === block.hash)
      if (alreadyExists) return

      entries.set(key, [...existing, { block, addedAt: Date.now() }])
      totalSize++
    },

    getByParentHash(parentHash: string): readonly Block[] {
      return (entries.get(parentHash) ?? []).map(e => e.block)
    },

    removeByParentHash(parentHash: string): void {
      const list = entries.get(parentHash)
      if (list) {
        totalSize -= list.length
        entries.delete(parentHash)
      }
    },

    cleanup(ttlMs: number = DEFAULT_TTL_MS): number {
      const now = Date.now()
      let removed = 0

      for (const [key, list] of entries) {
        const remaining = list.filter(e => now - e.addedAt < ttlMs)
        removed += list.length - remaining.length
        totalSize -= list.length - remaining.length

        if (remaining.length === 0) {
          entries.delete(key)
        }
        else {
          entries.set(key, remaining)
        }
      }

      return removed
    },

    clear(): void {
      entries.clear()
      totalSize = 0
    },
  }
}
