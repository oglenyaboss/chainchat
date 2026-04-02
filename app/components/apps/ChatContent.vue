<script setup lang="ts">
import { useBlockchainStore } from '~/stores/blockchain'
import { useChatStore } from '~/stores/chat'
import { useIdentityStore } from '~/stores/identity'
import { usePeerStore } from '~/stores/peers'

const identityStore = useIdentityStore()
const blockchainStore = useBlockchainStore()
const peerStore = usePeerStore()
const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement | null>(null)

// State machine is provided by the desktop page
const stateMachine = inject<{ sendMessage: (text: string) => Promise<void> }>('stateMachine')

// Resizable pane widths
const sidebarWidth = ref(180)
const explorerWidth = ref(220)

const SIDEBAR_MIN = 100
const SIDEBAR_MAX = 350
const EXPLORER_MIN = 140
const EXPLORER_MAX = 400

function onLeftSplitterDrag(delta: number): void {
  sidebarWidth.value = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, sidebarWidth.value + delta))
}

function onRightSplitterDrag(delta: number): void {
  explorerWidth.value = Math.max(EXPLORER_MIN, Math.min(EXPLORER_MAX, explorerWidth.value - delta))
}

async function handleSend(text: string): Promise<void> {
  if (stateMachine) {
    await stateMachine.sendMessage(text)
  }

  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function openPrivateChat(publicKey: string): void {
  chatStore.setActiveChannel(publicKey)
}

const channelItems = computed(() => {
  const items = [{ id: 'broadcast', label: 'Broadcast' }]
  for (const peer of peerStore.peerList) {
    items.push({ id: peer.publicKey, label: peer.nickname })
  }
  return items
})

const recentBlocks = computed(() =>
  [...blockchainStore.chain].reverse().slice(0, 10),
)
</script>

<template>
  <div class="chat-layout">
    <!-- Left sidebar -->
    <div class="chat-sidebar win95-inset" :style="{ width: `${sidebarWidth}px` }">
      <div class="chat-sidebar__section">
        <div class="chat-sidebar__header">
          Channels
        </div>
        <ChatChannelList
          :channels="channelItems"
          :active-channel="chatStore.activeChannel"
          @select="chatStore.setActiveChannel"
        />
      </div>
      <Win95Divider />
      <div class="chat-sidebar__section">
        <div class="chat-sidebar__header">
          Peers ({{ peerStore.peerCount }})
        </div>
        <ChatPeerList
          :peers="peerStore.peerList"
          @select-peer="openPrivateChat"
        />
      </div>
    </div>

    <!-- Left splitter -->
    <Win95Splitter @drag="onLeftSplitterDrag" />

    <!-- Center: Messages -->
    <div class="chat-center">
      <div class="chat-center__header">
        <span class="chat-center__title">
          {{ chatStore.activeChannel === 'broadcast' ? '#broadcast' : 'Private' }}
        </span>
        <span class="chat-center__stats">
          {{ blockchainStore.blockCount }} blocks | {{ blockchainStore.pendingTransactions.length }} pending
        </span>
      </div>
      <div ref="messagesContainer" class="chat-center__messages win95-inset">
        <ChatMessageLine
          v-for="msg in chatStore.channelMessages"
          :key="msg.id"
          :message="msg"
          :is-own="msg.from === identityStore.publicKey"
        />
        <div v-if="chatStore.channelMessages.length === 0" class="chat-center__empty">
          No messages yet. Say something!
        </div>
      </div>
      <ChatMessageInput @send="handleSend" />
    </div>

    <!-- Right splitter -->
    <Win95Splitter @drag="onRightSplitterDrag" />

    <!-- Right sidebar: Mini explorer -->
    <div class="chat-explorer win95-inset" :style="{ width: `${explorerWidth}px` }">
      <div class="chat-explorer__header">
        Latest Blocks
      </div>
      <div class="chat-explorer__blocks">
        <ExplorerBlockCard
          v-for="block in recentBlocks"
          :key="block.hash"
          :block="block"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  height: 100%;
}

.chat-sidebar {
  background: var(--win95-input-bg);
  overflow-y: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.chat-sidebar__section {
  padding: 4px;
}

.chat-sidebar__header {
  font-family: var(--win95-font-ui);
  font-size: 11px;
  font-weight: 700;
  color: var(--win95-dark-shadow);
  padding: 2px 4px;
  text-transform: uppercase;
}

.chat-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-center__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--win95-surface);
  border-bottom: 1px solid var(--win95-shadow);
}

.chat-center__title {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  font-weight: 700;
}

.chat-center__stats {
  font-family: var(--win95-font-mono);
  font-size: 10px;
  color: var(--win95-shadow);
}

.chat-center__messages {
  flex: 1;
  overflow-y: auto;
  background: var(--win95-input-bg);
  padding: 4px;
}

.chat-center__empty {
  color: var(--win95-shadow);
  font-family: var(--win95-font-ui);
  font-size: 11px;
  text-align: center;
  padding: 24px;
}

.chat-explorer {
  background: var(--win95-input-bg);
  overflow-y: auto;
  flex-shrink: 0;
}

.chat-explorer__header {
  font-family: var(--win95-font-ui);
  font-size: 11px;
  font-weight: 700;
  color: var(--win95-dark-shadow);
  padding: 4px 6px;
  text-transform: uppercase;
}

.chat-explorer__blocks {
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
