<template>
  <div class="network">
    <div class="network__toolbar">
      <span class="network__info">{{ peerStore.peerCount + 1 }} nodes in mesh</span>
      <NetworkMiningStatus
        :is-mining="nodeState.isMining"
        :hashrate="nodeState.hashrate"
        :nonce="nodeState.currentNonce"
      />
    </div>

    <div class="network__graph">
      <NetworkMeshGraph
        :peers="peerStore.peerList"
        :my-peer-id="identityStore.peerId"
        :width="graphWidth"
        :height="300"
      />
    </div>

    <div class="network__stats">
      <div class="network__stat-card win95-raised">
        <span class="network__stat-value">{{ peerStore.peerCount }}</span>
        <span class="network__stat-label">Connected Peers</span>
      </div>
      <div class="network__stat-card win95-raised">
        <span class="network__stat-value">{{ blockchainStore.blockCount }}</span>
        <span class="network__stat-label">Blocks Mined</span>
      </div>
      <div class="network__stat-card win95-raised">
        <span class="network__stat-value">{{ blockchainStore.pendingTransactions.length }}</span>
        <span class="network__stat-label">Pending Tx</span>
      </div>
      <div class="network__stat-card win95-raised">
        <span class="network__stat-value" :style="{ color: stateColor }">{{ nodeState.state }}</span>
        <span class="network__stat-label">Node State</span>
      </div>
    </div>

    <div class="network__peers">
      <div class="network__peers-header">Peer Details</div>
      <div class="network__peers-list win95-inset">
        <div class="network__peer-row network__peer-row--header">
          <span class="network__peer-status">&nbsp;</span>
          <span class="network__peer-name">Name</span>
          <span class="network__peer-key">Public Key</span>
          <span class="network__peer-hashrate">Hashrate</span>
        </div>
        <div class="network__peer-row">
          <span class="network__peer-status" style="color: var(--win95-success);">&#9679;</span>
          <span class="network__peer-name">{{ identityStore.nickname }} (you)</span>
          <span class="network__peer-key">{{ shortKey(identityStore.publicKey) }}</span>
          <span class="network__peer-hashrate">&mdash;</span>
        </div>
        <div
          v-for="peer in peerStore.peerList"
          :key="peer.peerId"
          class="network__peer-row"
        >
          <span class="network__peer-status" style="color: var(--win95-selected);">&#9679;</span>
          <span class="network__peer-name">{{ peer.nickname }}</span>
          <span class="network__peer-key">{{ shortKey(peer.publicKey) }}</span>
          <span class="network__peer-hashrate">{{ formatHashrate(peer.hashrate) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIdentityStore } from '~/stores/identity'
import { usePeerStore } from '~/stores/peers'
import { useBlockchainStore } from '~/stores/blockchain'
import { useNodeStateStore } from '~/stores/node-state'

const identityStore = useIdentityStore()
const peerStore = usePeerStore()
const blockchainStore = useBlockchainStore()
const nodeState = useNodeStateStore()

const graphWidth = ref(600)
const containerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  updateGraphWidth()
  window.addEventListener('resize', updateGraphWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateGraphWidth)
})

function updateGraphWidth(): void {
  const el = containerRef.value ?? document.querySelector('.network')
  if (el) {
    graphWidth.value = Math.max(300, el.clientWidth - 32)
  }
}

const stateColor = computed(() => {
  const colors: Record<string, string> = {
    INIT: '#808080',
    CONNECTING: '#D97706',
    SYNCING: '#0000FF',
    READY: '#16A34A',
    MINING: '#D97706',
  }
  return colors[nodeState.state] ?? '#808080'
})

function shortKey(key: string): string {
  try {
    const parsed = JSON.parse(key)
    const x = parsed.x || ''
    return `${x.slice(0, 8)}...`
  }
  catch {
    return key.slice(0, 12)
  }
}

function formatHashrate(h: number): string {
  if (h === 0) return 'idle'
  if (h > 1000) return `${(h / 1000).toFixed(1)} kH/s`
  return `${h} H/s`
}
</script>

<style scoped>
.network {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}

.network__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.network__info {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  color: var(--win95-dark-shadow);
}

.network__graph {
  overflow: hidden;
}

.network__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.network__stat-card {
  background: var(--win95-surface);
  padding: 8px;
  text-align: center;
}

.network__stat-value {
  display: block;
  font-family: var(--win95-font-ui);
  font-size: 20px;
  font-weight: 700;
  color: var(--win95-selected);
}

.network__stat-label {
  display: block;
  font-family: var(--win95-font-ui);
  font-size: 10px;
  color: var(--win95-dark-shadow);
  margin-top: 2px;
}

.network__peers {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.network__peers-header {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  font-weight: 700;
}

.network__peers-list {
  background: var(--win95-input-bg);
  padding: 0;
}

.network__peer-row {
  display: grid;
  grid-template-columns: 20px 1fr 140px 80px;
  gap: 4px;
  padding: 3px 6px;
  font-family: var(--win95-font-ui);
  font-size: 11px;
  align-items: center;
}

.network__peer-row:nth-child(even) {
  background: #F0F0F0;
}

.network__peer-row--header {
  background: var(--win95-surface) !important;
  font-weight: 700;
  border-bottom: 1px solid var(--win95-shadow);
}

.network__peer-status {
  font-size: 8px;
  text-align: center;
}

.network__peer-key {
  font-family: var(--win95-font-mono);
  font-size: 10px;
  color: var(--win95-shadow);
}

.network__peer-hashrate {
  font-family: var(--win95-font-mono);
  font-size: 10px;
  color: var(--win95-dark-shadow);
  text-align: right;
}
</style>
