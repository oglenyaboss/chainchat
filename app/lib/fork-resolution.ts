import type { Block } from './blockchain'

/**
 * Deterministic fork resolution.
 *
 * Rules:
 * 1. Longer chain always wins
 * 2. Equal-length chains: lexicographically smaller tip hash wins
 * 3. Identical chains: no replacement needed
 */
export function shouldReplaceChain(
  currentChain: readonly Block[],
  candidateChain: readonly Block[],
): boolean {
  if (candidateChain.length > currentChain.length) {
    return true
  }

  if (candidateChain.length === currentChain.length && candidateChain.length > 0) {
    const currentTip = currentChain.at(-1)!
    const candidateTip = candidateChain.at(-1)!

    // Lexicographically smaller hash wins — deterministic tiebreak
    if (candidateTip.hash < currentTip.hash) {
      return true
    }
  }

  return false
}
