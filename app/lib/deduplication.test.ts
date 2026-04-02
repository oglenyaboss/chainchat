import { createBlockSeenSet, createSeenSet, createTransactionSeenSet } from '~/lib/deduplication'

describe('createSeenSet', () => {
  it('returns false for unseen id and true after markSeen', () => {
    const set = createSeenSet()
    expect(set.hasSeen('abc')).toBe(false)
    set.markSeen('abc')
    expect(set.hasSeen('abc')).toBe(true)
  })

  it('increments size on first markSeen', () => {
    const set = createSeenSet()
    expect(set.size).toBe(0)
    set.markSeen('abc')
    expect(set.size).toBe(1)
  })

  it('duplicate markSeen does not increase size', () => {
    const set = createSeenSet()
    set.markSeen('abc')
    set.markSeen('abc')
    expect(set.size).toBe(1)
  })

  it('evicts oldest entry (FIFO) when capacity is reached', () => {
    const set = createSeenSet(3)
    set.markSeen('a')
    set.markSeen('b')
    set.markSeen('c')
    // capacity full — adding 'd' evicts 'a'
    set.markSeen('d')
    expect(set.hasSeen('a')).toBe(false)
    expect(set.hasSeen('b')).toBe(true)
    expect(set.hasSeen('c')).toBe(true)
    expect(set.hasSeen('d')).toBe(true)
    expect(set.size).toBe(3)
  })

  it('evicts entries in insertion order across multiple overflows', () => {
    const set = createSeenSet(2)
    set.markSeen('x')
    set.markSeen('y')
    set.markSeen('z') // evicts 'x'
    set.markSeen('w') // evicts 'y'
    expect(set.hasSeen('x')).toBe(false)
    expect(set.hasSeen('y')).toBe(false)
    expect(set.hasSeen('z')).toBe(true)
    expect(set.hasSeen('w')).toBe(true)
  })

  it('clear() resets size to 0 and forgets all entries', () => {
    const set = createSeenSet()
    set.markSeen('a')
    set.markSeen('b')
    set.clear()
    expect(set.size).toBe(0)
    expect(set.hasSeen('a')).toBe(false)
    expect(set.hasSeen('b')).toBe(false)
  })

  it('can be re-used after clear()', () => {
    const set = createSeenSet(2)
    set.markSeen('a')
    set.markSeen('b')
    set.clear()
    set.markSeen('c')
    expect(set.size).toBe(1)
    expect(set.hasSeen('c')).toBe(true)
  })
})

describe('createBlockSeenSet', () => {
  it('evicts at capacity 5000', () => {
    const set = createBlockSeenSet()
    for (let i = 0; i < 5000; i++) {
      set.markSeen(`block-${i}`)
    }
    expect(set.size).toBe(5000)
    set.markSeen('overflow')
    expect(set.size).toBe(5000)
    expect(set.hasSeen('block-0')).toBe(false)
    expect(set.hasSeen('overflow')).toBe(true)
  })
})

describe('createTransactionSeenSet', () => {
  it('evicts at capacity 10000', () => {
    const set = createTransactionSeenSet()
    for (let i = 0; i < 10000; i++) {
      set.markSeen(`tx-${i}`)
    }
    expect(set.size).toBe(10000)
    set.markSeen('overflow')
    expect(set.size).toBe(10000)
    expect(set.hasSeen('tx-0')).toBe(false)
    expect(set.hasSeen('overflow')).toBe(true)
  })
})
