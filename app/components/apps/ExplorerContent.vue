<script setup lang="ts">
import { useBlockchainStore } from '~/stores/blockchain'
import { useNodeStateStore } from '~/stores/node-state'

const blockchainStore = useBlockchainStore()
const nodeState = useNodeStateStore()

const activeTab = ref('overview')

const tabs = computed(() => [
  { id: 'overview', label: 'Overview' },
  { id: 'blocks', label: `Blocks (${blockchainStore.blockCount})` },
  { id: 'transactions', label: `Transactions (${blockchainStore.allTransactions.length})` },
  { id: 'mempool', label: `Mempool (${blockchainStore.pendingTransactions.length})` },
])

const showReorgBadge = computed(() => {
  if (!nodeState.chainReplacedAt)
    return false
  return Date.now() - nodeState.chainReplacedAt < 5000
})
</script>

<template>
  <div class="explorer">
    <div class="explorer__badges">
      <Win95Badge v-if="showReorgBadge" color="warning">
        Chain reorganized
      </Win95Badge>
      <Win95Badge v-if="nodeState.orphanPoolSize > 0">
        {{ nodeState.orphanPoolSize }} orphans
      </Win95Badge>
    </div>

    <Win95Tabs v-model="activeTab" :tabs="tabs" class="explorer__tabs">
      <div class="explorer__tab-content">
        <ExplorerOverview v-if="activeTab === 'overview'" />
        <ExplorerBlocks v-else-if="activeTab === 'blocks'" />
        <ExplorerTransactions v-else-if="activeTab === 'transactions'" />
        <ExplorerMempool v-else-if="activeTab === 'mempool'" />
      </div>
    </Win95Tabs>
  </div>
</template>

<style scoped>
.explorer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  height: 100%;
  overflow: hidden;
}

.explorer__badges {
  display: flex;
  gap: 4px;
  min-height: 0;
}

.explorer__badges:empty {
  display: none;
}

.explorer__tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.explorer__tab-content {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
</style>
