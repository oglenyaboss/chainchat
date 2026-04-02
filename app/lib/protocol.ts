import type { Block, Transaction } from './blockchain'

export type PeerMessage =
  | { type: 'hello'; peerId: string; publicKey: string; nickname: string }
  | { type: 'peer-list'; peers: PeerInfo[] }
  | { type: 'new-transaction'; transaction: Transaction }
  | { type: 'new-block'; block: Block }
  | { type: 'request-chain' }
  | { type: 'chain-response'; chain: Block[] }
  | { type: 'ping' }
  | { type: 'pong' }
  // Enhanced sync protocol
  | { type: 'request-chain-head' }
  | { type: 'chain-head-response'; index: number; hash: string }
  | { type: 'request-blocks'; fromIndex: number }
  | { type: 'blocks-response'; blocks: Block[]; totalLength: number }

export interface PeerInfo {
  readonly peerId: string
  readonly publicKey: string
  readonly nickname: string
}

export function serializeMessage(msg: PeerMessage): string {
  return JSON.stringify(msg)
}

export function deserializeMessage(data: string): PeerMessage | null {
  try {
    return JSON.parse(data) as PeerMessage
  }
  catch {
    return null
  }
}
