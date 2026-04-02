<template>
  <div class="blocks-tab">
    <div class="blocks-tab__toolbar">
      <Win95Input
        v-model="search"
        placeholder="Search by hash, block index, or public key..."
        class="blocks-tab__search"
      />
      <span class="blocks-tab__count">{{ filteredBlocks.length }} / {{ blockchainStore.blockCount }} blocks</span>
    </div>

    <div class="blocks-tab__list">
      <ExplorerBlockDetail
        v-for="block in filteredBlocks"
        :key="block.hash"
        :block="block"
      />
      <div v-if="filteredBlocks.length === 0" class="blocks-tab__empty">
        No blocks match your search
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBlockchainStore } from '~/stores/blockchain'

const blockchainStore = useBlockchainStore()
const search = ref('')

const filteredBlocks = computed(() => {
  const reversed = [...blockchainStore.chain].reverse()
  if (!search.value) return reversed

  const q = search.value.toLowerCase()
  return reversed.filter(block =>
    block.hash.toLowerCase().includes(q)
    || block.index.toString() === q
    || block.transactions.some(tx =>
      tx.from.toLowerCase().includes(q) || tx.to.toLowerCase().includes(q),
    ),
  )
})
</script>

<style scoped>
.blocks-tab {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.blocks-tab__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blocks-tab__search {
  flex: 1;
  max-width: 400px;
}

.blocks-tab__count {
  font-family: var(--win95-font-ui);
  font-size: 11px;
  color: var(--win95-shadow);
  flex-shrink: 0;
}

.blocks-tab__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.blocks-tab__empty {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  color: var(--win95-shadow);
  font-style: italic;
  padding: 12px;
  text-align: center;
}
</style>
