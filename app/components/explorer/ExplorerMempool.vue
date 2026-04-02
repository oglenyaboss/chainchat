<script setup lang="ts">
import { useBlockchainStore } from '~/stores/blockchain'

const blockchainStore = useBlockchainStore()

const pending = computed(() => blockchainStore.pendingTransactions)
</script>

<template>
  <div class="mempool-tab">
    <div class="mempool-tab__info">
      <Win95Badge v-if="pending.length > 0" color="warning">
        {{ pending.length }} pending transaction{{ pending.length !== 1 ? 's' : '' }}
      </Win95Badge>
      <span class="mempool-tab__hint">
        Transactions waiting to be included in the next mined block
      </span>
    </div>

    <div v-if="pending.length > 0" class="mempool-tab__list win95-inset">
      <ExplorerTransactionDetail
        v-for="tx in pending"
        :key="tx.id"
        :tx="tx"
        :block-index="null"
      />
    </div>

    <div v-else class="mempool-tab__empty win95-inset">
      <div class="mempool-tab__empty-icon">
        &#128230;
      </div>
      <div class="mempool-tab__empty-text">
        No pending transactions
      </div>
      <div class="mempool-tab__empty-hint">
        Send a message in ChainChat to create a transaction
      </div>
    </div>
  </div>
</template>

<style scoped>
.mempool-tab {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mempool-tab__info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mempool-tab__hint {
  font-family: var(--win95-font-ui);
  font-size: 11px;
  color: var(--win95-shadow);
}

.mempool-tab__list {
  background: var(--win95-input-bg);
  min-height: 80px;
  max-height: 400px;
  overflow-y: auto;
}

.mempool-tab__empty {
  background: var(--win95-input-bg);
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.mempool-tab__empty-icon {
  font-size: 32px;
}

.mempool-tab__empty-text {
  font-family: var(--win95-font-ui);
  font-size: 13px;
  font-weight: 700;
}

.mempool-tab__empty-hint {
  font-family: var(--win95-font-ui);
  font-size: 11px;
  color: var(--win95-shadow);
}
</style>
