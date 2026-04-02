import type { Block } from '~/lib/blockchain'
import { defineStore } from 'pinia'

export interface ChatMessage {
  readonly id: string
  readonly from: string
  readonly fromNickname: string
  readonly to: string
  readonly content: string
  readonly timestamp: number
  readonly blockIndex: number | null
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const activeChannel = ref<string>('broadcast')

  const channelMessages = computed(() =>
    messages.value.filter((msg) => {
      // Never show system messages in chat
      if (msg.to === '__system__')
        return false

      if (activeChannel.value === 'broadcast') {
        return msg.to === 'broadcast'
      }
      // Private channel: show messages between you and this peer
      return msg.to === activeChannel.value || msg.from === activeChannel.value
    }),
  )

  const channels = computed(() => {
    const set = new Set<string>(['broadcast'])
    for (const msg of messages.value) {
      if (msg.to !== 'broadcast' && msg.to !== '__system__') {
        set.add(msg.to)
        set.add(msg.from)
      }
    }
    return Array.from(set)
  })

  function addMessage(msg: ChatMessage) {
    const exists = messages.value.some(m => m.id === msg.id)
    if (!exists) {
      messages.value = [...messages.value, msg]
    }
  }

  function confirmMessage(txId: string, blockIndex: number) {
    messages.value = messages.value.map(msg =>
      msg.id === txId ? { ...msg, blockIndex } : msg,
    )
  }

  function setActiveChannel(channel: string) {
    activeChannel.value = channel
  }

  /**
   * Reconstruct chat messages from blockchain.
   * Broadcast messages are loaded as plaintext.
   * Private messages need decryption (handled by caller via resolveContent).
   */
  function loadFromChain(
    chain: readonly Block[],
    resolveNickname: (publicKey: string) => string,
    resolveContent?: (tx: { from: string, to: string, message: string }) => Promise<string>,
  ) {
    const existingIds = new Set(messages.value.map(m => m.id))

    for (const block of chain) {
      for (const tx of block.transactions) {
        if (existingIds.has(tx.id)) {
          // Already have it — just make sure blockIndex is set
          confirmMessage(tx.id, block.index)
          continue
        }
        // Skip system transactions
        if (tx.to === '__system__')
          continue
        // Skip non-message transactions
        if (tx.type && tx.type !== 'message')
          continue

        // For broadcast: plaintext. For private: caller decrypts.
        const contentPromise = (tx.to !== 'broadcast' && resolveContent)
          ? resolveContent(tx)
          : Promise.resolve(tx.message)

        contentPromise.then((content) => {
          addMessage({
            id: tx.id,
            from: tx.from,
            fromNickname: resolveNickname(tx.from),
            to: tx.to,
            content,
            timestamp: tx.timestamp,
            blockIndex: block.index,
          })
        }).catch(() => {
          addMessage({
            id: tx.id,
            from: tx.from,
            fromNickname: resolveNickname(tx.from),
            to: tx.to,
            content: '[unable to decrypt]',
            timestamp: tx.timestamp,
            blockIndex: block.index,
          })
        })
      }
    }
  }

  return {
    messages,
    activeChannel,
    channelMessages,
    channels,
    addMessage,
    confirmMessage,
    setActiveChannel,
    loadFromChain,
  }
})
