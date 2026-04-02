<template>
  <div class="block-card win95-raised">
    <div class="block-card__header">
      <span class="block-card__title">#{{ block.index }}</span>
      <Win95Badge :color="block.index === 0 ? 'warning' : 'default'">
        {{ block.index === 0 ? 'Genesis' : `${block.transactions.length} tx` }}
      </Win95Badge>
    </div>
    <div class="block-card__body win95-inset">
      <div class="block-card__row">
        <span class="block-card__label">Hash:</span>
        <span class="block-card__value block-card__value--hash">{{ block.hash.slice(0, 16) }}...</span>
      </div>
      <div class="block-card__row">
        <span class="block-card__label">Prev:</span>
        <span class="block-card__value">{{ block.previousHash.slice(0, 16) }}...</span>
      </div>
      <div class="block-card__row">
        <span class="block-card__label">Nonce:</span>
        <span class="block-card__value">{{ block.nonce.toLocaleString() }}</span>
      </div>
      <div class="block-card__row">
        <span class="block-card__label">Time:</span>
        <span class="block-card__value">{{ formatTime(block.timestamp) }}</span>
      </div>
    </div>
    <div v-if="block.transactions.length > 0" class="block-card__txns">
      <ExplorerTransactionRow v-for="tx in block.transactions" :key="tx.id" :tx="tx" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Block } from '~/lib/blockchain'

defineProps<{ block: Block }>()

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU')
}
</script>

<style scoped>
.block-card {
  background: var(--win95-surface);
  padding: 4px;
  min-width: 260px;
}

.block-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px;
  font-family: var(--win95-font-ui);
  font-weight: 700;
}

.block-card__title {
  font-size: 14px;
}

.block-card__body {
  padding: 6px;
  background: var(--win95-input-bg);
  margin: 4px 0;
}

.block-card__row {
  display: flex;
  gap: 8px;
  font-family: var(--win95-font-mono);
  font-size: 11px;
  line-height: 1.6;
}

.block-card__label {
  color: var(--win95-shadow);
  min-width: 44px;
}

.block-card__value {
  color: var(--win95-text);
}

.block-card__value--hash {
  color: var(--win95-selected);
}

.block-card__txns {
  border-top: 1px solid var(--win95-shadow);
  padding-top: 4px;
  margin-top: 4px;
}
</style>
