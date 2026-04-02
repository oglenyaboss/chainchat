<template>
  <div class="chain-view win95-inset" ref="scrollContainer">
    <div class="chain-view__inner">
      <div v-for="(block, i) in blocks" :key="block.hash" class="chain-view__item">
        <div class="chain-view__block win95-raised">
          <div class="chain-view__block-idx">#{{ block.index }}</div>
          <div class="chain-view__block-hash">{{ block.hash.slice(0, 8) }}...</div>
          <div class="chain-view__block-txns">{{ block.transactions.length }} tx</div>
        </div>
        <div v-if="i < blocks.length - 1" class="chain-view__arrow">&#9654;</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Block } from '~/lib/blockchain'

const props = defineProps<{ blocks: Block[] }>()

const scrollContainer = ref<HTMLElement | null>(null)

watch(() => props.blocks.length, () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollLeft = scrollContainer.value.scrollWidth
    }
  })
})
</script>

<style scoped>
.chain-view {
  overflow-x: auto;
  padding: 8px;
  background: var(--win95-input-bg);
}

.chain-view__inner {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: min-content;
}

.chain-view__item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chain-view__block {
  background: var(--win95-surface);
  padding: 6px 8px;
  min-width: 100px;
  text-align: center;
}

.chain-view__block-idx {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  font-weight: 700;
}

.chain-view__block-hash {
  font-family: var(--win95-font-mono);
  font-size: 9px;
  color: var(--win95-shadow);
  margin-top: 2px;
}

.chain-view__block-txns {
  font-family: var(--win95-font-ui);
  font-size: 10px;
  color: var(--win95-dark-shadow);
  margin-top: 2px;
}

.chain-view__arrow {
  color: var(--win95-shadow);
  font-size: 10px;
  flex-shrink: 0;
}
</style>
