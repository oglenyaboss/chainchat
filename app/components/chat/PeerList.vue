<template>
  <div class="peer-list">
    <div
      v-for="peer in peers"
      :key="peer.peerId"
      class="peer-list__item"
      @click="$emit('select-peer', peer.publicKey)"
    >
      <span class="peer-list__status">&#9679;</span>
      <span class="peer-list__name">{{ peer.nickname }}</span>
      <span class="peer-list__hashrate">{{ formatHashrate(peer.hashrate) }}</span>
    </div>
    <div v-if="peers.length === 0" class="peer-list__empty">
      No peers connected
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConnectedPeer } from '~/stores/peers'

defineProps<{
  peers: ConnectedPeer[]
}>()

defineEmits<{
  'select-peer': [publicKey: string]
}>()

function formatHashrate(h: number): string {
  if (h === 0) return 'idle'
  if (h > 1000) return `${(h / 1000).toFixed(1)}kH/s`
  return `${h} H/s`
}
</script>

<style scoped>
.peer-list__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  font-family: var(--win95-font-ui);
  font-size: 12px;
  cursor: pointer;
}

.peer-list__item:hover {
  background: var(--win95-selected);
  color: var(--win95-selected-text);
}

.peer-list__status {
  color: var(--win95-success);
  font-size: 8px;
}

.peer-list__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.peer-list__hashrate {
  color: var(--win95-shadow);
  font-size: 10px;
}

.peer-list__empty {
  color: var(--win95-shadow);
  font-size: 11px;
  text-align: center;
  padding: 8px;
}
</style>
