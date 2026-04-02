import type { Block } from '~/lib/blockchain'
import {
  adjustDifficulty,
  createGenesisBlock,
  createTransactionPayload,
  DIFFICULTY_ADJUSTMENT_INTERVAL,
  isValidProof,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  TARGET_BLOCK_TIME_MS,
} from '~/lib/blockchain'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock(index: number, timestamp: number): Block {
  return {
    index,
    timestamp,
    transactions: [],
    previousHash: index === 0 ? '0' : `hash-${index - 1}`,
    nonce: 0,
    hash: `hash-${index}`,
  }
}

/**
 * Build a chain of `count` blocks where each block is `msApart` milliseconds
 * after the previous one, starting at timestamp `startTime`.
 */
function makeChain(count: number, startTime: number, msApart: number): readonly Block[] {
  return Array.from({ length: count }, (_, i) => makeBlock(i, startTime + i * msApart))
}

// ---------------------------------------------------------------------------
// createTransactionPayload
// ---------------------------------------------------------------------------

describe('createTransactionPayload', () => {
  it('returns correctly formatted colon-separated string', () => {
    const payload = createTransactionPayload({
      type: 'message',
      from: 'alice',
      to: 'bob',
      message: 'hello',
      timestamp: 1000,
    })
    expect(payload).toBe('message:alice:bob:hello:1000')
  })

  it('works for register-name type', () => {
    const payload = createTransactionPayload({
      type: 'register-name',
      from: 'alice',
      to: '',
      message: 'alice-handle',
      timestamp: 9999,
    })
    expect(payload).toBe('register-name:alice::alice-handle:9999')
  })
})

// ---------------------------------------------------------------------------
// isValidProof
// ---------------------------------------------------------------------------

describe('isValidProof', () => {
  it('returns true when hash starts with enough leading zeros', () => {
    expect(isValidProof('000abc', 3)).toBe(true)
  })

  it('returns false when hash does not have enough leading zeros', () => {
    expect(isValidProof('001abc', 3)).toBe(false)
  })

  it('returns true for any hash with difficulty 0', () => {
    expect(isValidProof('', 0)).toBe(true)
    expect(isValidProof('abc', 0)).toBe(true)
  })

  it('returns false when hash has fewer leading zeros than difficulty', () => {
    expect(isValidProof('00abc', 3)).toBe(false)
  })

  it('returns true for exact match on longer difficulty', () => {
    expect(isValidProof('00000xyz', 5)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createGenesisBlock
// ---------------------------------------------------------------------------

describe('createGenesisBlock', () => {
  it('returns block with index 0', () => {
    expect(createGenesisBlock().index).toBe(0)
  })

  it('returns block with fixed timestamp 1711929600000', () => {
    expect(createGenesisBlock().timestamp).toBe(1711929600000)
  })

  it('returns block with empty transactions array', () => {
    expect(createGenesisBlock().transactions).toEqual([])
  })

  it('returns block with previousHash "0"', () => {
    expect(createGenesisBlock().previousHash).toBe('0')
  })

  it('returns block with nonce 0', () => {
    expect(createGenesisBlock().nonce).toBe(0)
  })

  it('returns block with fixed hash "genesis-chainchat-2026"', () => {
    expect(createGenesisBlock().hash).toBe('genesis-chainchat-2026')
  })

  it('is deterministic — calling twice returns identical block', () => {
    expect(createGenesisBlock()).toEqual(createGenesisBlock())
  })
})

// ---------------------------------------------------------------------------
// adjustDifficulty
// ---------------------------------------------------------------------------

describe('adjustDifficulty', () => {
  const BASE_TIME = 1_000_000
  // INTERVAL=5, so we need at least 6 blocks (indices 0–5)
  const REQUIRED = DIFFICULTY_ADJUSTMENT_INTERVAL + 1 // 6
  it('returns current difficulty unchanged when chain has fewer than 6 blocks', () => {
    const shortChain = makeChain(5, BASE_TIME, TARGET_BLOCK_TIME_MS)
    expect(adjustDifficulty(shortChain, 5)).toBe(5)
  })

  it('returns current difficulty unchanged when chain has exactly 5 blocks (< 6)', () => {
    const chain = makeChain(DIFFICULTY_ADJUSTMENT_INTERVAL, BASE_TIME, TARGET_BLOCK_TIME_MS)
    expect(adjustDifficulty(chain, 5)).toBe(5)
  })

  describe('with exactly 6 blocks', () => {
    it('increases difficulty when blocks are mined too fast (actualTime < expected * 0.8)', () => {
      // actual time = 4 * fastMs; must be < EXPECTED_TIME * 0.8 = 40 000 ms
      // Use 5 ms per block → actual = 5 * 5 = 25 ms → well under threshold
      const fastChain = makeChain(REQUIRED, BASE_TIME, 5)
      expect(adjustDifficulty(fastChain, 5)).toBe(6)
    })

    it('decreases difficulty when blocks are mined too slowly (actualTime > expected * 1.2)', () => {
      // actual time must be > EXPECTED_TIME * 1.2 = 60 000 ms
      // Use 20 000 ms per block → actual = 5 * 20 000 = 100 000 ms → over threshold
      const slowChain = makeChain(REQUIRED, BASE_TIME, 20_000)
      expect(adjustDifficulty(slowChain, 6)).toBe(5)
    })

    it('keeps difficulty unchanged when blocks are mined at normal speed', () => {
      // actual time must be between EXPECTED_TIME * 0.8 (40 000) and * 1.2 (60 000)
      // Use exactly TARGET_BLOCK_TIME_MS per block → actual = 50 000 ms → in range
      const normalChain = makeChain(REQUIRED, BASE_TIME, TARGET_BLOCK_TIME_MS)
      expect(adjustDifficulty(normalChain, 5)).toBe(5)
    })
  })

  it('will not increase difficulty above MAX_DIFFICULTY (6)', () => {
    const fastChain = makeChain(REQUIRED, BASE_TIME, 1)
    expect(adjustDifficulty(fastChain, MAX_DIFFICULTY)).toBe(MAX_DIFFICULTY)
  })

  it('will not decrease difficulty below MIN_DIFFICULTY (5)', () => {
    const slowChain = makeChain(REQUIRED, BASE_TIME, 20_000)
    expect(adjustDifficulty(slowChain, MIN_DIFFICULTY)).toBe(MIN_DIFFICULTY)
  })

  it('adjusts correctly when chain is longer than INTERVAL+1', () => {
    // 10 blocks, fast mining — difficulty should still increase
    const fastChain = makeChain(10, BASE_TIME, 1)
    expect(adjustDifficulty(fastChain, 5)).toBe(6)
  })
})
