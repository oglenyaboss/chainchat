import type { Block } from '~/lib/blockchain'
import { shouldReplaceChain } from '~/lib/fork-resolution'

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    index: 0,
    timestamp: 0,
    transactions: [],
    previousHash: '0',
    nonce: 0,
    hash: 'hash',
    ...overrides,
  }
}

function makeChain(hashes: string[]): Block[] {
  return hashes.map((hash, index) =>
    makeBlock({ index, hash, previousHash: index === 0 ? '0' : hashes[index - 1]! }),
  )
}

describe('shouldReplaceChain', () => {
  it('longer candidate replaces current chain', () => {
    const current = makeChain(['a', 'b'])
    const candidate = makeChain(['a', 'b', 'c'])
    expect(shouldReplaceChain(current, candidate)).toBe(true)
  })

  it('shorter candidate does NOT replace current chain', () => {
    const current = makeChain(['a', 'b', 'c'])
    const candidate = makeChain(['a', 'b'])
    expect(shouldReplaceChain(current, candidate)).toBe(false)
  })

  it('equal length: candidate with lexicographically smaller tip hash replaces', () => {
    const current = makeChain(['a', 'z'])
    const candidate = makeChain(['a', 'a'])
    expect(shouldReplaceChain(current, candidate)).toBe(true)
  })

  it('equal length: candidate with lexicographically larger tip hash does NOT replace', () => {
    const current = makeChain(['a', 'a'])
    const candidate = makeChain(['a', 'z'])
    expect(shouldReplaceChain(current, candidate)).toBe(false)
  })

  it('equal length with identical tip hash: no replacement', () => {
    const current = makeChain(['a', 'same'])
    const candidate = makeChain(['b', 'same'])
    expect(shouldReplaceChain(current, candidate)).toBe(false)
  })

  it('both chains empty: no replacement', () => {
    expect(shouldReplaceChain([], [])).toBe(false)
  })

  it('current empty, candidate non-empty: candidate replaces (longer wins)', () => {
    const candidate = makeChain(['genesis'])
    expect(shouldReplaceChain([], candidate)).toBe(true)
  })

  it('candidate empty, current non-empty: no replacement', () => {
    const current = makeChain(['genesis'])
    expect(shouldReplaceChain(current, [])).toBe(false)
  })

  it('single-block chains: smaller hash wins', () => {
    const current = [makeBlock({ hash: 'bbb' })]
    const candidate = [makeBlock({ hash: 'aaa' })]
    expect(shouldReplaceChain(current, candidate)).toBe(true)
  })

  it('single-block chains: larger hash does not win', () => {
    const current = [makeBlock({ hash: 'aaa' })]
    const candidate = [makeBlock({ hash: 'bbb' })]
    expect(shouldReplaceChain(current, candidate)).toBe(false)
  })
})
