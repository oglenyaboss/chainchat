<template>
  <div class="overview">
    <div class="overview__stats">
      <Win95GroupBox label="Chain Statistics">
        <div class="overview__grid">
          <div class="overview__stat">
            <span class="overview__stat-label">Blocks</span>
            <span class="overview__stat-value">{{ blockchainStore.blockCount }}</span>
          </div>
          <div class="overview__stat">
            <span class="overview__stat-label">Transactions</span>
            <span class="overview__stat-value">{{ blockchainStore.allTransactions.length }}</span>
          </div>
          <div class="overview__stat">
            <span class="overview__stat-label">Difficulty</span>
            <span class="overview__stat-value">{{ blockchainStore.difficulty }}</span>
          </div>
          <div class="overview__stat">
            <span class="overview__stat-label">Avg Block Time</span>
            <span class="overview__stat-value">{{ avgBlockTime }}</span>
          </div>
          <div class="overview__stat">
            <span class="overview__stat-label">Pending TXs</span>
            <span class="overview__stat-value">{{ blockchainStore.pendingTransactions.length }}</span>
          </div>
          <div class="overview__stat">
            <span class="overview__stat-label">Names</span>
            <span class="overview__stat-value">{{ registeredNames.length }}</span>
          </div>
        </div>
      </Win95GroupBox>

      <Win95GroupBox label="Mining Status">
        <div class="overview__grid">
          <div class="overview__stat">
            <span class="overview__stat-label">Status</span>
            <span class="overview__stat-value" :class="nodeState.isMining ? 'overview__stat-value--active' : ''">
              {{ nodeState.isMining ? 'Mining' : 'Idle' }}
            </span>
          </div>
          <div class="overview__stat">
            <span class="overview__stat-label">Hashrate</span>
            <span class="overview__stat-value">{{ formatHashrate(nodeState.hashrate) }}</span>
          </div>
          <div class="overview__stat">
            <span class="overview__stat-label">Current Nonce</span>
            <span class="overview__stat-value">{{ nodeState.currentNonce.toLocaleString() }}</span>
          </div>
          <div class="overview__stat">
            <span class="overview__stat-label">Orphan Pool</span>
            <span class="overview__stat-value">{{ nodeState.orphanPoolSize }}</span>
          </div>
          <div class="overview__stat">
            <span class="overview__stat-label">Node State</span>
            <span class="overview__stat-value">{{ nodeState.state }}</span>
          </div>
        </div>
      </Win95GroupBox>
    </div>

    <Win95GroupBox label="Chain Validation">
      <div class="overview__validation">
        <Win95Button :disabled="validating" @click="runValidation">
          {{ validating ? 'Validating...' : 'Validate Entire Chain' }}
        </Win95Button>
        <div v-if="validating" class="overview__progress">
          <Win95ProgressBar :value="validationProgress" />
          <span class="overview__progress-text">{{ validationProgress }}%</span>
        </div>
        <div v-if="validationResult !== null" class="overview__validation-result">
          <Win95Badge :color="validationResult ? 'success' : 'danger'">
            {{ validationResult ? 'Chain Valid — all blocks and signatures verified' : 'Chain Invalid — integrity compromised' }}
          </Win95Badge>
        </div>
      </div>
    </Win95GroupBox>

    <Win95GroupBox label="Chain Visualization">
      <ExplorerChainView :blocks="blockchainStore.chain" />
    </Win95GroupBox>

    <Win95GroupBox v-if="registeredNames.length > 0" label="Name Registry">
      <div class="overview__names win95-inset">
        <div class="overview__names-header">
          <span class="overview__names-col overview__names-col--name">Name</span>
          <span class="overview__names-col overview__names-col--key">Public Key</span>
          <span class="overview__names-col overview__names-col--block">Block</span>
        </div>
        <div
          v-for="entry in registeredNames"
          :key="entry.name"
          class="overview__name-row"
        >
          <span class="overview__names-col overview__names-col--name overview__names-col--bold">{{ entry.name }}</span>
          <span class="overview__names-col overview__names-col--key">{{ shortKey(entry.publicKey) }}</span>
          <span class="overview__names-col overview__names-col--block">#{{ entry.blockIndex }}</span>
        </div>
      </div>
    </Win95GroupBox>
  </div>
</template>

<script setup lang="ts">
import { useBlockchainStore } from '~/stores/blockchain'
import { useNodeStateStore } from '~/stores/node-state'
import { validateBlock } from '~/lib/blockchain'

const blockchainStore = useBlockchainStore()
const nodeState = useNodeStateStore()

const validating = ref(false)
const validationProgress = ref(0)
const validationResult = ref<boolean | null>(null)

const registeredNames = computed(() =>
  Array.from(blockchainStore.nameRegistry.values()),
)

const avgBlockTime = computed(() => {
  const chain = blockchainStore.chain
  if (chain.length < 2) return 'N/A'
  const count = Math.min(chain.length - 1, 10)
  const recent = chain.slice(-count - 1)
  let totalMs = 0
  for (let i = 1; i < recent.length; i++) {
    totalMs += recent[i]!.timestamp - recent[i - 1]!.timestamp
  }
  const avgMs = totalMs / count
  return `${(avgMs / 1000).toFixed(1)}s`
})

function formatHashrate(h: number): string {
  if (h === 0) return '0 H/s'
  if (h >= 1000) return `${(h / 1000).toFixed(1)} kH/s`
  return `${h.toFixed(0)} H/s`
}

function shortKey(key: string): string {
  try {
    const parsed = JSON.parse(key)
    const x = (parsed.x || '') as string
    return `${x.slice(0, 8)}...${x.slice(-4)}`
  }
  catch {
    return key.slice(0, 12) + '...'
  }
}

async function runValidation() {
  validating.value = true
  validationProgress.value = 0
  validationResult.value = null

  const chain = blockchainStore.chain
  let allValid = true

  for (let i = 0; i < chain.length; i++) {
    const prev = i > 0 ? (chain[i - 1] ?? null) : null
    const valid = await validateBlock(chain[i]!, prev)
    if (!valid) {
      allValid = false
      break
    }
    validationProgress.value = Math.round(((i + 1) / chain.length) * 100)
    // Yield to UI
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  validationResult.value = allValid
  validating.value = false
}
</script>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overview__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

@media (max-width: 600px) {
  .overview__stats {
    grid-template-columns: 1fr;
  }
}

.overview__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
}

.overview__stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  font-family: var(--win95-font-ui);
  font-size: 12px;
}

.overview__stat-label {
  color: var(--win95-dark-shadow);
}

.overview__stat-value {
  font-weight: 700;
  font-family: var(--win95-font-mono);
  font-size: 12px;
}

.overview__stat-value--active {
  color: green;
}

.overview__validation {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.overview__progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.overview__progress-text {
  font-family: var(--win95-font-mono);
  font-size: 11px;
  min-width: 36px;
}

.overview__names {
  background: var(--win95-input-bg);
  padding: 4px;
  max-height: 160px;
  overflow-y: auto;
}

.overview__names-header {
  display: flex;
  gap: 8px;
  padding: 2px 4px;
  font-family: var(--win95-font-ui);
  font-size: 11px;
  font-weight: 700;
  border-bottom: 1px solid var(--win95-shadow);
  margin-bottom: 2px;
}

.overview__name-row {
  display: flex;
  gap: 8px;
  padding: 2px 4px;
  font-family: var(--win95-font-mono);
  font-size: 11px;
}

.overview__name-row:nth-child(even) {
  background: var(--win95-surface);
}

.overview__names-col--name {
  min-width: 120px;
}

.overview__names-col--key {
  flex: 1;
  color: var(--win95-dark-shadow);
}

.overview__names-col--block {
  min-width: 48px;
  color: var(--win95-shadow);
  text-align: right;
}

.overview__names-col--bold {
  font-weight: 700;
}
</style>
