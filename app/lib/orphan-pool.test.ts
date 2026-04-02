import type { Block } from '~/lib/blockchain'
import { createOrphanPool } from '~/lib/orphan-pool'

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    index: 1,
    timestamp: Date.now(),
    transactions: [],
    previousHash: 'prev-hash',
    nonce: 0,
    hash: 'block-hash',
    ...overrides,
  }
}

describe('createOrphanPool', () => {
  it('starts with size 0', () => {
    const pool = createOrphanPool()
    expect(pool.size).toBe(0)
  })

  it('add increases size and getByParentHash retrieves by previousHash', () => {
    const pool = createOrphanPool()
    const block = makeBlock({ previousHash: 'parent-1', hash: 'h1' })
    pool.add(block)
    expect(pool.size).toBe(1)
    const results = pool.getByParentHash('parent-1')
    expect(results).toHaveLength(1)
    expect(results[0]).toBe(block)
  })

  it('getByParentHash returns empty array for unknown parent', () => {
    const pool = createOrphanPool()
    expect(pool.getByParentHash('unknown')).toEqual([])
  })

  it('duplicate blocks (same hash) are not added twice', () => {
    const pool = createOrphanPool()
    const block = makeBlock({ previousHash: 'p', hash: 'same-hash' })
    pool.add(block)
    pool.add(block)
    expect(pool.size).toBe(1)
    expect(pool.getByParentHash('p')).toHaveLength(1)
  })

  it('multiple blocks with the same parent are all stored', () => {
    const pool = createOrphanPool()
    const b1 = makeBlock({ previousHash: 'parent', hash: 'h1' })
    const b2 = makeBlock({ previousHash: 'parent', hash: 'h2' })
    pool.add(b1)
    pool.add(b2)
    expect(pool.size).toBe(2)
    expect(pool.getByParentHash('parent')).toHaveLength(2)
  })

  it('removeByParentHash removes all blocks with that parent', () => {
    const pool = createOrphanPool()
    pool.add(makeBlock({ previousHash: 'p1', hash: 'h1' }))
    pool.add(makeBlock({ previousHash: 'p1', hash: 'h2' }))
    pool.add(makeBlock({ previousHash: 'p2', hash: 'h3' }))
    pool.removeByParentHash('p1')
    expect(pool.size).toBe(1)
    expect(pool.getByParentHash('p1')).toHaveLength(0)
    expect(pool.getByParentHash('p2')).toHaveLength(1)
  })

  it('removeByParentHash is a no-op for unknown parent', () => {
    const pool = createOrphanPool()
    pool.add(makeBlock({ previousHash: 'p', hash: 'h' }))
    pool.removeByParentHash('nonexistent')
    expect(pool.size).toBe(1)
  })

  it('evicts oldest block when capacity is full', () => {
    const pool = createOrphanPool(2)
    const old = makeBlock({ previousHash: 'p-old', hash: 'h-old' })
    const mid = makeBlock({ previousHash: 'p-mid', hash: 'h-mid' })
    const newest = makeBlock({ previousHash: 'p-new', hash: 'h-new' })

    vi.useFakeTimers()
    vi.setSystemTime(1000)
    pool.add(old)
    vi.setSystemTime(2000)
    pool.add(mid)
    // pool is now full; adding newest should evict oldest (old)
    vi.setSystemTime(3000)
    pool.add(newest)
    vi.useRealTimers()

    expect(pool.size).toBe(2)
    expect(pool.getByParentHash('p-old')).toHaveLength(0)
    expect(pool.getByParentHash('p-mid')).toHaveLength(1)
    expect(pool.getByParentHash('p-new')).toHaveLength(1)
  })

  it('cleanup removes entries older than TTL and returns removed count', () => {
    const pool = createOrphanPool()

    vi.useFakeTimers()
    vi.setSystemTime(1000)
    pool.add(makeBlock({ previousHash: 'p-old', hash: 'h-old' }))
    vi.setSystemTime(9000)
    pool.add(makeBlock({ previousHash: 'p-fresh', hash: 'h-fresh' }))

    // now = 9000; TTL = 5000ms → anything added before t=4000 is stale
    // old was added at t=1000 (8000ms ago) → removed
    // fresh was added at t=9000 (0ms ago) → kept
    const removed = pool.cleanup(5000)
    vi.useRealTimers()

    expect(removed).toBe(1)
    expect(pool.size).toBe(1)
    expect(pool.getByParentHash('p-old')).toHaveLength(0)
    expect(pool.getByParentHash('p-fresh')).toHaveLength(1)
  })

  it('cleanup with large TTL removes nothing', () => {
    const pool = createOrphanPool()
    pool.add(makeBlock({ previousHash: 'p', hash: 'h' }))
    const removed = pool.cleanup(999_999_999)
    expect(removed).toBe(0)
    expect(pool.size).toBe(1)
  })

  it('cleanup with TTL=0 removes all entries', () => {
    const pool = createOrphanPool()
    pool.add(makeBlock({ previousHash: 'p1', hash: 'h1' }))
    pool.add(makeBlock({ previousHash: 'p2', hash: 'h2' }))
    const removed = pool.cleanup(0)
    expect(removed).toBe(2)
    expect(pool.size).toBe(0)
  })

  it('clear() resets size to 0 and empties all entries', () => {
    const pool = createOrphanPool()
    pool.add(makeBlock({ previousHash: 'p1', hash: 'h1' }))
    pool.add(makeBlock({ previousHash: 'p2', hash: 'h2' }))
    pool.clear()
    expect(pool.size).toBe(0)
    expect(pool.getByParentHash('p1')).toHaveLength(0)
  })
})
