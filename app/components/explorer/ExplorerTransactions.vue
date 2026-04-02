<script setup lang="ts">
import type { Transaction, TransactionType } from '~/lib/blockchain'
import { useBlockchainStore } from '~/stores/blockchain'

const blockchainStore = useBlockchainStore()
const filter = ref<'all' | TransactionType>('all')
const search = ref('')

interface TxWithBlock {
  readonly tx: Transaction
  readonly blockIndex: number
}

const allTransactions = computed((): readonly TxWithBlock[] => {
  const result: TxWithBlock[] = []
  for (const block of blockchainStore.chain) {
    for (const tx of block.transactions) {
      result.push({ tx, blockIndex: block.index })
    }
  }
  return result.reverse()
})

const messageCount = computed(() =>
  allTransactions.value.filter(item => item.tx.type === 'message').length,
)

const registerCount = computed(() =>
  allTransactions.value.filter(item => item.tx.type === 'register-name').length,
)

const filteredTransactions = computed(() => {
  let items = allTransactions.value
  if (filter.value !== 'all') {
    items = items.filter(item => item.tx.type === filter.value)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    items = items.filter(item =>
      item.tx.from.toLowerCase().includes(q)
      || item.tx.to.toLowerCase().includes(q)
      || item.tx.message.toLowerCase().includes(q),
    )
  }
  return items
})
</script>

<template>
  <div class="txns-tab">
    <div class="txns-tab__toolbar">
      <div class="txns-tab__filters">
        <Win95Button
          :class="{ 'txns-tab__filter--active': filter === 'all' }"
          @click="filter = 'all'"
        >
          All ({{ allTransactions.length }})
        </Win95Button>
        <Win95Button
          :class="{ 'txns-tab__filter--active': filter === 'message' }"
          @click="filter = 'message'"
        >
          Messages ({{ messageCount }})
        </Win95Button>
        <Win95Button
          :class="{ 'txns-tab__filter--active': filter === 'register-name' }"
          @click="filter = 'register-name'"
        >
          Registrations ({{ registerCount }})
        </Win95Button>
      </div>
      <Win95Input
        v-model="search"
        placeholder="Search by address or message..."
        class="txns-tab__search"
      />
    </div>

    <div class="txns-tab__header">
      <span class="txns-tab__col txns-tab__col--type">Type</span>
      <span class="txns-tab__col txns-tab__col--from">From</span>
      <span class="txns-tab__col txns-tab__col--arrow" />
      <span class="txns-tab__col txns-tab__col--to">To</span>
      <span class="txns-tab__col txns-tab__col--msg">Content</span>
      <span class="txns-tab__col txns-tab__col--block">Block</span>
      <span class="txns-tab__col txns-tab__col--time">Time</span>
      <span class="txns-tab__col txns-tab__col--sig">Sig</span>
    </div>

    <div class="txns-tab__list win95-inset">
      <ExplorerTransactionDetail
        v-for="item in filteredTransactions"
        :key="item.tx.id"
        :tx="item.tx"
        :block-index="item.blockIndex"
      />
      <div v-if="filteredTransactions.length === 0" class="txns-tab__empty">
        No transactions match your filter
      </div>
    </div>
  </div>
</template>

<style scoped>
.txns-tab {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.txns-tab__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.txns-tab__filters {
  display: flex;
  gap: 2px;
}

.txns-tab__filter--active {
  border-style: inset !important;
  background: var(--win95-input-bg) !important;
}

.txns-tab__search {
  flex: 1;
  min-width: 150px;
  max-width: 300px;
}

.txns-tab__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  font-family: var(--win95-font-ui);
  font-size: 10px;
  font-weight: 700;
  color: var(--win95-dark-shadow);
  border-bottom: 1px solid var(--win95-shadow);
}

.txns-tab__col--type { width: 36px; flex-shrink: 0; }
.txns-tab__col--from { width: 100px; flex-shrink: 0; }
.txns-tab__col--arrow { width: 12px; flex-shrink: 0; }
.txns-tab__col--to { width: 100px; flex-shrink: 0; }
.txns-tab__col--msg { flex: 1; }
.txns-tab__col--block { width: 40px; flex-shrink: 0; }
.txns-tab__col--time { width: 60px; flex-shrink: 0; }
.txns-tab__col--sig { width: 20px; flex-shrink: 0; }

.txns-tab__list {
  background: var(--win95-input-bg);
  min-height: 100px;
  max-height: 400px;
  overflow-y: auto;
}

.txns-tab__empty {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  color: var(--win95-shadow);
  font-style: italic;
  padding: 12px;
  text-align: center;
}
</style>
