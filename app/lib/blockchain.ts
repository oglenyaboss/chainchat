import { sha256, signMessage, verifySignature } from './crypto'

export type TransactionType = 'message' | 'register-name'

export interface Transaction {
  readonly id: string
  readonly type: TransactionType
  readonly from: string
  readonly to: string
  readonly message: string
  readonly signature: string
  readonly timestamp: number
}

// --- Mining constants ---
export const MAX_TRANSACTIONS_PER_BLOCK = 20
export const DIFFICULTY_ADJUSTMENT_INTERVAL = 5
export const TARGET_BLOCK_TIME_MS = 10_000
export const MIN_DIFFICULTY = 5
export const MAX_DIFFICULTY = 6

export interface Block {
  readonly index: number
  readonly timestamp: number
  readonly transactions: readonly Transaction[]
  readonly previousHash: string
  readonly nonce: number
  readonly hash: string
}

export function createTransactionPayload(tx: Omit<Transaction, 'signature' | 'id'>): string {
  return `${tx.type}:${tx.from}:${tx.to}:${tx.message}:${tx.timestamp}`
}

export async function createTransaction(
  type: TransactionType,
  from: string,
  to: string,
  message: string,
  privateKey: string,
): Promise<Transaction> {
  const timestamp = Date.now()
  const payload = createTransactionPayload({ type, from, to, message, timestamp })
  const signature = await signMessage(privateKey, payload)
  const id = await sha256(`${payload}:${signature}`)
  return { id, type, from, to, message, signature, timestamp }
}

export async function verifyTransaction(tx: Transaction): Promise<boolean> {
  // Backward compat: old transactions without type are treated as 'message'
  const normalized = tx.type ? tx : { ...tx, type: 'message' as TransactionType }
  const payload = createTransactionPayload(normalized)
  return verifySignature(normalized.from, payload, normalized.signature)
}

export async function calculateBlockHash(block: Omit<Block, 'hash'>): Promise<string> {
  const data = `${block.index}:${block.timestamp}:${JSON.stringify(block.transactions)}:${block.previousHash}:${block.nonce}`
  return sha256(data)
}

export function isValidProof(hash: string, difficulty: number): boolean {
  return hash.startsWith('0'.repeat(difficulty))
}

export async function validateBlock(block: Block, previousBlock: Block | null): Promise<boolean> {
  // Genesis block uses a fixed symbolic hash — skip recalculation
  if (block.index === 0 && previousBlock === null) {
    const genesis = createGenesisBlock()
    return (
      block.hash === genesis.hash
      && block.previousHash === genesis.previousHash
      && block.timestamp === genesis.timestamp
      && block.transactions.length === 0
    )
  }

  const expectedHash = await calculateBlockHash({
    index: block.index,
    timestamp: block.timestamp,
    transactions: block.transactions,
    previousHash: block.previousHash,
    nonce: block.nonce,
  })
  if (block.hash !== expectedHash) return false
  if (previousBlock !== null) {
    if (block.previousHash !== previousBlock.hash) return false
    if (block.index !== previousBlock.index + 1) return false
  }
  for (const tx of block.transactions) {
    const valid = await verifyTransaction(tx)
    if (!valid) return false
  }
  return true
}

export async function validateChain(chain: readonly Block[]): Promise<boolean> {
  for (let i = 0; i < chain.length; i++) {
    const prev = i > 0 ? (chain[i - 1] ?? null) : null
    const valid = await validateBlock(chain[i]!, prev)
    if (!valid) return false
  }
  return true
}

export function createGenesisBlock(): Block {
  return {
    index: 0,
    timestamp: 1711929600000,
    transactions: [],
    previousHash: '0',
    nonce: 0,
    hash: 'genesis-chainchat-2026',
  }
}

/**
 * Calculate new difficulty based on recent block times.
 * Called every DIFFICULTY_ADJUSTMENT_INTERVAL blocks.
 */
export function adjustDifficulty(chain: readonly Block[], currentDifficulty: number): number {
  const len = chain.length
  if (len < DIFFICULTY_ADJUSTMENT_INTERVAL + 1) return currentDifficulty

  const recentBlock = chain[len - 1]!
  const referenceBlock = chain[len - DIFFICULTY_ADJUSTMENT_INTERVAL]!

  const actualTime = recentBlock.timestamp - referenceBlock.timestamp
  const expectedTime = DIFFICULTY_ADJUSTMENT_INTERVAL * TARGET_BLOCK_TIME_MS

  if (actualTime < expectedTime * 0.8) {
    return Math.min(currentDifficulty + 1, MAX_DIFFICULTY)
  }
  if (actualTime > expectedTime * 1.2) {
    return Math.max(currentDifficulty - 1, MIN_DIFFICULTY)
  }
  return currentDifficulty
}
