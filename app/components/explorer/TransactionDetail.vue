<script setup lang="ts">
import type { Transaction } from '~/lib/blockchain'
import { verifyTransaction } from '~/lib/blockchain'
import { useBlockchainStore } from '~/stores/blockchain'

const props = defineProps<{
  tx: Transaction
  blockIndex?: number | null
}>()

const blockchainStore = useBlockchainStore()
const expanded = ref(false)
const verifyStatus = ref<'loading' | 'valid' | 'invalid'>('loading')
const copyState = reactive({ txId: false, from: false, to: false })

const resolvedFrom = computed(() => {
  const name = blockchainStore.getNameForKey(props.tx.from)
  const short = shortKey(props.tx.from)
  return name ? `${name} (${short})` : short
})

const resolvedTo = computed(() => {
  if (props.tx.to === 'broadcast')
    return 'BROADCAST'
  if (props.tx.to === '__system__')
    return 'SYSTEM'
  const name = blockchainStore.getNameForKey(props.tx.to)
  const short = shortKey(props.tx.to)
  return name ? `${name} (${short})` : short
})

function shortKey(key: string): string {
  try {
    const parsed = JSON.parse(key)
    const x = (parsed.x || '') as string
    return `${x.slice(0, 6)}...${x.slice(-4)}`
  }
  catch {
    return key.slice(0, 10)
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

async function copy(text: string, field: 'txId' | 'from' | 'to' = 'txId') {
  await navigator.clipboard.writeText(text)
  copyState[field] = true
  setTimeout(() => {
    copyState[field] = false
  }, 1500)
}

// Verify signature on mount
onMounted(async () => {
  try {
    const valid = await verifyTransaction(props.tx)
    verifyStatus.value = valid ? 'valid' : 'invalid'
  }
  catch {
    verifyStatus.value = 'invalid'
  }
})
</script>

<template>
  <div class="tx-detail" :class="{ 'tx-detail--expanded': expanded }">
    <div class="tx-detail__row" @click="expanded = !expanded">
      <Win95Badge :color="tx.type === 'register-name' ? 'success' : 'primary'" class="tx-detail__type">
        {{ tx.type === 'register-name' ? 'REG' : 'MSG' }}
      </Win95Badge>

      <span class="tx-detail__addr" :title="tx.from">
        {{ resolvedFrom }}
      </span>

      <span class="tx-detail__arrow">&rarr;</span>

      <span class="tx-detail__addr" :title="tx.to">
        {{ resolvedTo }}
      </span>

      <span v-if="tx.type === 'message'" class="tx-detail__msg" :title="tx.message">
        {{ tx.message.length > 30 ? `${tx.message.slice(0, 30)}...` : tx.message }}
      </span>
      <span v-else class="tx-detail__msg tx-detail__msg--name">
        name: {{ tx.message }}
      </span>

      <span v-if="blockIndex !== null" class="tx-detail__block">
        #{{ blockIndex }}
      </span>
      <span v-else class="tx-detail__block tx-detail__block--pending">
        pending
      </span>

      <span class="tx-detail__time">{{ formatTime(tx.timestamp) }}</span>

      <span class="tx-detail__verify">
        <template v-if="verifyStatus === 'loading'">...</template>
        <template v-else-if="verifyStatus === 'valid'">&check;</template>
        <template v-else-if="verifyStatus === 'invalid'">&cross;</template>
      </span>

      <span class="tx-detail__expand">{{ expanded ? '&#9660;' : '&#9654;' }}</span>
    </div>

    <div v-if="expanded" class="tx-detail__body win95-inset">
      <div class="tx-detail__field">
        <span class="tx-detail__label">TX ID:</span>
        <span class="tx-detail__value tx-detail__value--mono">{{ tx.id }}</span>
        <button class="tx-detail__copy" @click.stop="copy(tx.id)">
          {{ copyState.txId ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <div class="tx-detail__field">
        <span class="tx-detail__label">Type:</span>
        <span class="tx-detail__value">{{ tx.type }}</span>
      </div>
      <div class="tx-detail__field">
        <span class="tx-detail__label">From:</span>
        <span class="tx-detail__value tx-detail__value--mono tx-detail__value--wrap">{{ tx.from }}</span>
        <button class="tx-detail__copy" @click.stop="copy(tx.from, 'from')">
          {{ copyState.from ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <div class="tx-detail__field">
        <span class="tx-detail__label">To:</span>
        <span class="tx-detail__value tx-detail__value--mono tx-detail__value--wrap">{{ tx.to }}</span>
        <button class="tx-detail__copy" @click.stop="copy(tx.to, 'to')">
          {{ copyState.to ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <div class="tx-detail__field">
        <span class="tx-detail__label">Message:</span>
        <span class="tx-detail__value">{{ tx.message }}</span>
      </div>
      <div class="tx-detail__field">
        <span class="tx-detail__label">Signature:</span>
        <span class="tx-detail__value tx-detail__value--mono tx-detail__value--wrap">{{ tx.signature }}</span>
      </div>
      <div class="tx-detail__field">
        <span class="tx-detail__label">Timestamp:</span>
        <span class="tx-detail__value">{{ new Date(tx.timestamp).toLocaleString('ru-RU') }}</span>
      </div>
      <div class="tx-detail__field">
        <span class="tx-detail__label">Verified:</span>
        <span
          class="tx-detail__value"
          :class="{
            'tx-detail__value--valid': verifyStatus === 'valid',
            'tx-detail__value--invalid': verifyStatus === 'invalid',
          }"
        >
          {{ verifyStatus === 'loading' ? 'Verifying...' : verifyStatus === 'valid' ? 'Signature Valid' : 'Signature Invalid' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tx-detail {
  font-family: var(--win95-font-mono);
  font-size: 11px;
}

.tx-detail__row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  cursor: pointer;
}

.tx-detail__row:hover {
  background: var(--win95-selected);
  color: var(--win95-selected-text);
}

.tx-detail__row:hover .tx-detail__addr,
.tx-detail__row:hover .tx-detail__arrow,
.tx-detail__row:hover .tx-detail__msg,
.tx-detail__row:hover .tx-detail__block,
.tx-detail__row:hover .tx-detail__time {
  color: var(--win95-selected-text);
}

.tx-detail__type {
  flex-shrink: 0;
}

.tx-detail__addr {
  color: var(--win95-selected);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-detail__arrow {
  color: var(--win95-shadow);
  flex-shrink: 0;
}

.tx-detail__msg {
  color: var(--win95-dark-shadow);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-detail__msg--name {
  font-style: italic;
}

.tx-detail__block {
  color: var(--win95-shadow);
  flex-shrink: 0;
  font-size: 10px;
}

.tx-detail__block--pending {
  color: orange;
  font-style: italic;
}

.tx-detail__time {
  color: var(--win95-shadow);
  flex-shrink: 0;
  font-size: 10px;
}

.tx-detail__verify {
  flex-shrink: 0;
  font-size: 12px;
  width: 14px;
  text-align: center;
  color: green;
}

.tx-detail__expand {
  flex-shrink: 0;
  font-size: 8px;
  color: var(--win95-shadow);
  width: 10px;
}

.tx-detail__body {
  margin: 2px 4px 6px 4px;
  padding: 6px 8px;
  background: var(--win95-input-bg);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tx-detail__field {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.tx-detail__label {
  color: var(--win95-shadow);
  min-width: 72px;
  flex-shrink: 0;
  font-family: var(--win95-font-ui);
  font-size: 11px;
}

.tx-detail__value {
  flex: 1;
  min-width: 0;
}

.tx-detail__value--mono {
  font-family: var(--win95-font-mono);
  font-size: 10px;
}

.tx-detail__value--wrap {
  word-break: break-all;
}

.tx-detail__value--valid {
  color: green;
  font-weight: 700;
}

.tx-detail__value--invalid {
  color: red;
  font-weight: 700;
}

.tx-detail__copy {
  font-family: var(--win95-font-ui);
  font-size: 10px;
  padding: 0 4px;
  background: var(--win95-surface);
  border: 1px solid var(--win95-shadow);
  cursor: pointer;
  flex-shrink: 0;
}

.tx-detail__copy:active {
  border-style: inset;
}
</style>
