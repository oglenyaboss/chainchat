<template>
  <div class="mining-status win95-raised">
    <span class="mining-status__icon">{{ isMining ? '&#9935;' : '&#128564;' }}</span>
    <div class="mining-status__info">
      <span class="mining-status__label">{{ isMining ? 'Mining...' : 'Idle' }}</span>
      <span v-if="isMining" class="mining-status__detail">
        {{ formatHashrate(hashrate) }} | #{{ nonce.toLocaleString() }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isMining: boolean
  hashrate: number
  nonce: number
}>()

function formatHashrate(h: number): string {
  if (h > 1_000_000) return `${(h / 1_000_000).toFixed(1)} MH/s`
  if (h > 1_000) return `${(h / 1_000).toFixed(1)} kH/s`
  return `${h} H/s`
}
</script>

<style scoped>
.mining-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--win95-surface);
}

.mining-status__icon {
  font-size: 16px;
}

.mining-status__info {
  display: flex;
  flex-direction: column;
}

.mining-status__label {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  font-weight: 700;
}

.mining-status__detail {
  font-family: var(--win95-font-mono);
  font-size: 10px;
  color: var(--win95-shadow);
}
</style>
