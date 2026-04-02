import type { Block } from '~/lib/blockchain'
import { createSyncCoordinator } from '~/lib/sync'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock(index: number): Block {
  return {
    index,
    timestamp: Date.now() + index * 1000,
    transactions: [],
    previousHash: index === 0 ? '0' : `hash-${index - 1}`,
    nonce: 0,
    hash: `hash-${index}`,
  }
}

function makeBlocks(count: number): Block[] {
  return Array.from({ length: count }, (_, i) => makeBlock(i))
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('createSyncCoordinator — initial state', () => {
  it('starts in idle phase', () => {
    const coordinator = createSyncCoordinator()
    expect(coordinator.state.phase).toBe('idle')
  })

  it('starts with progress 0', () => {
    const coordinator = createSyncCoordinator()
    expect(coordinator.state.progress).toBe(0)
  })

  it('starts with bestPeer null', () => {
    const coordinator = createSyncCoordinator()
    expect(coordinator.state.bestPeer).toBeNull()
  })

  it('starts with bestIndex 0', () => {
    const coordinator = createSyncCoordinator()
    expect(coordinator.state.bestIndex).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// startSync
// ---------------------------------------------------------------------------

describe('startSync', () => {
  it('transitions to "complete" when no peers are provided', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync([], 1)
    expect(coordinator.state.phase).toBe('complete')
  })

  it('transitions to "collecting-heads" when peers are provided', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1', 'peer-2'], 1)
    expect(coordinator.state.phase).toBe('collecting-heads')
  })

  it('resets progress to 0 on new sync', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 1)
    expect(coordinator.state.progress).toBe(0)
  })

  it('resets bestPeer to null on new sync', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 1)
    expect(coordinator.state.bestPeer).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// handleChainHeadResponse
// ---------------------------------------------------------------------------

describe('handleChainHeadResponse', () => {
  it('tracks the peer with the longest chain as best', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1', 'peer-2', 'peer-3'], 0)

    coordinator.handleChainHeadResponse('peer-1', 5, 'hash-a')
    coordinator.handleChainHeadResponse('peer-2', 10, 'hash-b')
    coordinator.handleChainHeadResponse('peer-3', 3, 'hash-c')

    expect(coordinator.state.bestPeer).toBe('peer-2')
    expect(coordinator.state.bestIndex).toBe(10)
  })

  it('updates progress as peers respond', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1', 'peer-2'], 0)

    coordinator.handleChainHeadResponse('peer-1', 5, 'hash-a')
    expect(coordinator.state.progress).toBe(0.5)
  })

  it('moves to "downloading-blocks" when all peers respond and best is ahead of local', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1', 'peer-2'], 3) // local length = 3

    coordinator.handleChainHeadResponse('peer-1', 10, 'hash-a')
    coordinator.handleChainHeadResponse('peer-2', 7, 'hash-b')

    expect(coordinator.state.phase).toBe('downloading-blocks')
  })

  it('moves to "complete" when all peers respond but local chain is longer', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1', 'peer-2'], 20) // local length = 20

    coordinator.handleChainHeadResponse('peer-1', 10, 'hash-a')
    coordinator.handleChainHeadResponse('peer-2', 7, 'hash-b')

    expect(coordinator.state.phase).toBe('complete')
  })

  it('moves to "downloading-blocks" when best index equals local length (not strictly greater)', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 5)

    coordinator.handleChainHeadResponse('peer-1', 5, 'hash-a')

    expect(coordinator.state.phase).toBe('downloading-blocks')
  })

  it('ignores responses when not in collecting-heads phase', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync([], 0) // goes straight to 'complete'

    coordinator.handleChainHeadResponse('peer-1', 999, 'hash-x')

    expect(coordinator.state.bestIndex).toBe(0)
    expect(coordinator.state.phase).toBe('complete')
  })

  it('uses smaller hash as tiebreaker when two peers have equal chain length', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-a', 'peer-b'], 0)

    coordinator.handleChainHeadResponse('peer-a', 10, 'zzz-hash')
    coordinator.handleChainHeadResponse('peer-b', 10, 'aaa-hash')

    expect(coordinator.state.bestPeer).toBe('peer-b')
  })
})

// ---------------------------------------------------------------------------
// handleBlocksResponse
// ---------------------------------------------------------------------------

describe('handleBlocksResponse', () => {
  it('accumulates blocks and returns progress < 1 when not complete', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 0)
    coordinator.handleChainHeadResponse('peer-1', 10, 'hash-a')
    // now in 'downloading-blocks'

    const result = coordinator.handleBlocksResponse(makeBlocks(5), 10)

    expect(result.complete).toBe(false)
    expect(result.progress).toBeCloseTo(0.5)
    expect(result.chain).toBeNull()
  })

  it('returns complete=true and the full chain when all blocks received', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 0)
    coordinator.handleChainHeadResponse('peer-1', 5, 'hash-a')

    const blocks = makeBlocks(5)
    const result = coordinator.handleBlocksResponse(blocks, 5)

    expect(result.complete).toBe(true)
    expect(result.progress).toBe(1)
    expect(result.chain).toEqual(blocks)
  })

  it('accumulates across multiple calls', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 0)
    coordinator.handleChainHeadResponse('peer-1', 6, 'hash-a')

    const batch1 = makeBlocks(3)
    const batch2 = makeBlocks(3).map(b => makeBlock(b.index + 3))

    const first = coordinator.handleBlocksResponse(batch1, 6)
    expect(first.complete).toBe(false)

    const second = coordinator.handleBlocksResponse(batch2, 6)
    expect(second.complete).toBe(true)
    expect(second.chain).toHaveLength(6)
  })

  it('transitions to "complete" phase when done', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 0)
    coordinator.handleChainHeadResponse('peer-1', 2, 'hash-a')

    coordinator.handleBlocksResponse(makeBlocks(2), 2)

    expect(coordinator.state.phase).toBe('complete')
  })

  it('returns complete=true and chain=null when called outside downloading-blocks phase', () => {
    const coordinator = createSyncCoordinator()
    // idle phase
    const result = coordinator.handleBlocksResponse(makeBlocks(3), 3)
    expect(result.complete).toBe(true)
    expect(result.chain).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getBestPeer
// ---------------------------------------------------------------------------

describe('getBestPeer', () => {
  it('returns null before any peer responds', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 0)
    expect(coordinator.getBestPeer()).toBeNull()
  })

  it('returns the best peer id after receiving responses', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1', 'peer-2'], 0)

    coordinator.handleChainHeadResponse('peer-1', 3, 'hash-a')
    coordinator.handleChainHeadResponse('peer-2', 8, 'hash-b')

    expect(coordinator.getBestPeer()).toBe('peer-2')
  })
})

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe('reset', () => {
  it('returns to idle phase', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 0)
    coordinator.reset()
    expect(coordinator.state.phase).toBe('idle')
  })

  it('clears bestPeer', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 0)
    coordinator.handleChainHeadResponse('peer-1', 10, 'hash-a')
    coordinator.reset()
    expect(coordinator.state.bestPeer).toBeNull()
  })

  it('resets progress to 0', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 0)
    coordinator.handleChainHeadResponse('peer-1', 5, 'hash-a')
    coordinator.reset()
    expect(coordinator.state.progress).toBe(0)
  })

  it('allows fresh sync after reset', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 0)
    coordinator.handleChainHeadResponse('peer-1', 5, 'hash-a')
    coordinator.reset()

    coordinator.startSync(['peer-2'], 0)
    expect(coordinator.state.phase).toBe('collecting-heads')
  })
})

// ---------------------------------------------------------------------------
// isTimedOut
// ---------------------------------------------------------------------------

describe('isTimedOut', () => {
  it('returns false when not in collecting-heads phase', () => {
    const coordinator = createSyncCoordinator()
    expect(coordinator.isTimedOut()).toBe(false)
  })

  it('returns false immediately after starting sync', () => {
    const coordinator = createSyncCoordinator()
    coordinator.startSync(['peer-1'], 0)
    expect(coordinator.isTimedOut()).toBe(false)
  })
})
