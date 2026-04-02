<script setup lang="ts">
import type { Transaction } from '~/lib/blockchain'

defineProps<{ tx: Transaction }>()

function shortKey(key: string): string {
  try {
    const parsed = JSON.parse(key)
    const x = parsed.x || ''
    return `${x.slice(0, 6)}...${x.slice(-4)}`
  }
  catch {
    return key.slice(0, 10)
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div class="tx-row">
    <span class="tx-row__arrow">&#8594;</span>
    <span class="tx-row__addr" :title="tx.from">{{ shortKey(tx.from) }}</span>
    <span class="tx-row__arrow">&#8594;</span>
    <span class="tx-row__addr" :title="tx.to">
      {{ tx.to === 'broadcast' ? 'BROADCAST' : shortKey(tx.to) }}
    </span>
    <span class="tx-row__time">{{ formatTime(tx.timestamp) }}</span>
  </div>
</template>

<style scoped>
.tx-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--win95-font-mono);
  font-size: 10px;
  padding: 1px 4px;
}

.tx-row__arrow {
  color: var(--win95-shadow);
}

.tx-row__addr {
  color: var(--win95-selected);
}

.tx-row__time {
  margin-left: auto;
  color: var(--win95-shadow);
}
</style>
