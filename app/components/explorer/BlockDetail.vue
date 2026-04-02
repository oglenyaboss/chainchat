<script setup lang="ts">
import type { Block } from '~/lib/blockchain'
import { isValidProof } from '~/lib/blockchain'
import { useBlockchainStore } from '~/stores/blockchain'

const props = defineProps<{ block: Block }>()

const blockchainStore = useBlockchainStore()
const expanded = ref(false)
const hashCopied = ref(false)
const prevHashCopied = ref(false)

const difficulty = computed(() => blockchainStore.difficulty)

const powValid = computed(() => {
  if (props.block.index === 0)
    return true
  return isValidProof(props.block.hash, difficulty.value)
})

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

async function copyHash() {
  await navigator.clipboard.writeText(props.block.hash)
  hashCopied.value = true
  setTimeout(() => {
    hashCopied.value = false
  }, 1500)
}

async function copyPrevHash() {
  await navigator.clipboard.writeText(props.block.previousHash)
  prevHashCopied.value = true
  setTimeout(() => {
    prevHashCopied.value = false
  }, 1500)
}
</script>

<template>
  <div class="block-detail win95-raised">
    <div class="block-detail__header" @click="expanded = !expanded">
      <span class="block-detail__idx">#{{ block.index }}</span>

      <Win95Badge v-if="block.index === 0" color="warning">
        Genesis
      </Win95Badge>
      <Win95Badge v-else>
        {{ block.transactions.length }} tx
      </Win95Badge>

      <span class="block-detail__hash">{{ block.hash.slice(0, 16) }}...</span>

      <span class="block-detail__time">{{ formatTime(block.timestamp) }}</span>

      <span class="block-detail__nonce">nonce: {{ block.nonce.toLocaleString() }}</span>

      <span
        class="block-detail__pow"
        :class="powValid ? 'block-detail__pow--valid' : 'block-detail__pow--invalid'"
      >
        {{ powValid ? 'PoW Valid' : 'PoW Invalid' }}
      </span>

      <span class="block-detail__expand">{{ expanded ? '&#9660;' : '&#9654;' }}</span>
    </div>

    <div v-if="expanded" class="block-detail__body">
      <Win95GroupBox label="Block Header">
        <div class="block-detail__fields win95-inset">
          <div class="block-detail__field">
            <span class="block-detail__label">Index:</span>
            <span class="block-detail__value">{{ block.index }}</span>
          </div>
          <div class="block-detail__field">
            <span class="block-detail__label">Hash:</span>
            <span class="block-detail__value block-detail__value--mono block-detail__value--hash">{{ block.hash }}</span>
            <button class="block-detail__copy" @click.stop="copyHash">
              {{ hashCopied ? 'Copied' : 'Copy' }}
            </button>
          </div>
          <div class="block-detail__field">
            <span class="block-detail__label">Prev Hash:</span>
            <span class="block-detail__value block-detail__value--mono">{{ block.previousHash }}</span>
            <button class="block-detail__copy" @click.stop="copyPrevHash">
              {{ prevHashCopied ? 'Copied' : 'Copy' }}
            </button>
          </div>
          <div class="block-detail__field">
            <span class="block-detail__label">Nonce:</span>
            <span class="block-detail__value">{{ block.nonce.toLocaleString() }}</span>
          </div>
          <div class="block-detail__field">
            <span class="block-detail__label">Timestamp:</span>
            <span class="block-detail__value">{{ new Date(block.timestamp).toLocaleString('ru-RU') }}</span>
          </div>
          <div class="block-detail__field">
            <span class="block-detail__label">Difficulty:</span>
            <span class="block-detail__value">{{ difficulty }}</span>
          </div>
          <div class="block-detail__field">
            <span class="block-detail__label">PoW Check:</span>
            <span
              class="block-detail__value"
              :class="powValid ? 'block-detail__value--valid' : 'block-detail__value--invalid'"
            >
              {{ powValid ? `Valid (starts with ${'0'.repeat(difficulty)})` : 'Invalid proof-of-work' }}
            </span>
          </div>
          <div class="block-detail__field">
            <span class="block-detail__label">TX Count:</span>
            <span class="block-detail__value">{{ block.transactions.length }}</span>
          </div>
        </div>
      </Win95GroupBox>

      <Win95GroupBox v-if="block.transactions.length > 0" label="Transactions">
        <div class="block-detail__txns">
          <ExplorerTransactionDetail
            v-for="tx in block.transactions"
            :key="tx.id"
            :tx="tx"
            :block-index="block.index"
          />
        </div>
      </Win95GroupBox>
      <div v-else class="block-detail__empty">
        No transactions in this block
      </div>
    </div>
  </div>
</template>

<style scoped>
.block-detail {
  background: var(--win95-surface);
  padding: 2px;
}

.block-detail__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  cursor: pointer;
  font-family: var(--win95-font-ui);
  font-size: 12px;
}

.block-detail__header:hover {
  background: var(--win95-selected);
  color: var(--win95-selected-text);
}

.block-detail__header:hover .block-detail__hash,
.block-detail__header:hover .block-detail__time,
.block-detail__header:hover .block-detail__nonce {
  color: var(--win95-selected-text);
}

.block-detail__idx {
  font-weight: 700;
  min-width: 32px;
}

.block-detail__hash {
  font-family: var(--win95-font-mono);
  font-size: 10px;
  color: var(--win95-selected);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-detail__time {
  font-family: var(--win95-font-mono);
  font-size: 10px;
  color: var(--win95-shadow);
  flex-shrink: 0;
}

.block-detail__nonce {
  font-family: var(--win95-font-mono);
  font-size: 10px;
  color: var(--win95-dark-shadow);
  flex-shrink: 0;
}

.block-detail__pow {
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  padding: 0 4px;
}

.block-detail__pow--valid {
  color: green;
}

.block-detail__pow--invalid {
  color: red;
}

.block-detail__expand {
  font-size: 8px;
  color: var(--win95-shadow);
  flex-shrink: 0;
}

.block-detail__body {
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-detail__fields {
  padding: 6px 8px;
  background: var(--win95-input-bg);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.block-detail__field {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
}

.block-detail__label {
  font-family: var(--win95-font-ui);
  color: var(--win95-shadow);
  min-width: 80px;
  flex-shrink: 0;
}

.block-detail__value {
  flex: 1;
  min-width: 0;
  font-family: var(--win95-font-ui);
}

.block-detail__value--mono {
  font-family: var(--win95-font-mono);
  font-size: 10px;
  word-break: break-all;
}

.block-detail__value--hash {
  color: var(--win95-selected);
}

.block-detail__value--valid {
  color: green;
  font-weight: 700;
}

.block-detail__value--invalid {
  color: red;
  font-weight: 700;
}

.block-detail__copy {
  font-family: var(--win95-font-ui);
  font-size: 10px;
  padding: 0 4px;
  background: var(--win95-surface);
  border: 1px solid var(--win95-shadow);
  cursor: pointer;
  flex-shrink: 0;
}

.block-detail__copy:active {
  border-style: inset;
}

.block-detail__txns {
  display: flex;
  flex-direction: column;
}

.block-detail__empty {
  font-family: var(--win95-font-ui);
  font-size: 11px;
  color: var(--win95-shadow);
  font-style: italic;
  padding: 4px;
}
</style>
