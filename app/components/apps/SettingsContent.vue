<template>
  <div class="settings">
    <Win95Tabs :tabs="tabs" v-model="activeTab">
      <!-- Identity Tab -->
      <div v-if="activeTab === 'identity'" class="settings__tab">
        <Win95FormField label="Nickname">
          <Win95Input v-model="nickname" @blur="saveNickname" />
        </Win95FormField>
        <Win95FormField label="Peer ID">
          <Win95Input :model-value="identityStore.peerId" readonly />
        </Win95FormField>
        <Win95FormField label="Public Key">
          <Win95Textarea :model-value="shortPublicKey" readonly :rows="2" />
        </Win95FormField>
      </div>

      <!-- Mining Tab -->
      <div v-if="activeTab === 'mining'" class="settings__tab">
        <Win95FormField label="Difficulty (leading zeros)">
          <Win95Input v-model="difficulty" type="number" @blur="saveDifficulty" />
        </Win95FormField>
        <p class="settings__hint">Higher = slower blocks. Use 1-2 for demo, 3-4 for realistic feel.</p>
      </div>

      <!-- P2P Tab -->
      <div v-if="activeTab === 'p2p'" class="settings__tab">
        <Win95GroupBox label="Manual P2P (Zero Server)">
          <p class="settings__hint">Connect directly without the signaling server. Share your SDP with the other peer.</p>
          <Win95FormField label="Your SDP Offer">
            <Win95Textarea :model-value="localSDP" readonly :rows="3" />
          </Win95FormField>
          <Win95Button @click="copyToClipboard">Copy to Clipboard</Win95Button>
          <Win95FormField label="Paste Remote SDP">
            <Win95Textarea v-model="remoteSDP" :rows="3" placeholder="Paste SDP from other peer..." />
          </Win95FormField>
          <Win95Button variant="primary" @click="applyRemoteSDP">Connect</Win95Button>
        </Win95GroupBox>
      </div>

      <!-- Danger Zone Tab -->
      <div v-if="activeTab === 'danger'" class="settings__tab">
        <Win95GroupBox label="Danger Zone">
          <p class="settings__danger-text">&#9888; Warning: This action cannot be undone!</p>
          <Win95Button @click="resetIdentity">Reset Identity (generates new keypair)</Win95Button>
        </Win95GroupBox>
      </div>
    </Win95Tabs>
  </div>
</template>

<script setup lang="ts">
import { useIdentityStore } from '~/stores/identity'
import { useBlockchainStore } from '~/stores/blockchain'

const identityStore = useIdentityStore()
const blockchainStore = useBlockchainStore()

const activeTab = ref('identity')

const tabs = [
  { id: 'identity', label: 'Identity' },
  { id: 'mining', label: 'Mining' },
  { id: 'p2p', label: 'P2P' },
  { id: 'danger', label: 'Danger Zone' },
]

const nickname = ref(identityStore.nickname)
const difficulty = ref(String(blockchainStore.difficulty))
const localSDP = ref('')
const remoteSDP = ref('')

const shortPublicKey = computed(() => {
  try {
    const parsed = JSON.parse(identityStore.publicKey)
    return `x: ${parsed.x}\ny: ${parsed.y}`
  }
  catch {
    return identityStore.publicKey.slice(0, 80)
  }
})

function saveNickname(): void {
  identityStore.setNickname(nickname.value)
}

function saveDifficulty(): void {
  const val = parseInt(difficulty.value, 10)
  blockchainStore.difficulty = Math.max(1, Math.min(6, isNaN(val) ? 2 : val))
}

async function copyToClipboard(): Promise<void> {
  await navigator.clipboard.writeText(localSDP.value)
}

function applyRemoteSDP(): void {
  // Placeholder for manual SDP exchange flow
}

function resetIdentity(): void {
  localStorage.removeItem('identity')
  window.location.reload()
}
</script>

<style scoped>
.settings {
  padding: 8px;
  max-width: 500px;
}

.settings__tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings__hint {
  font-family: var(--win95-font-ui);
  font-size: 11px;
  color: var(--win95-dark-shadow);
}

.settings__danger-text {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  color: var(--win95-danger);
  margin-bottom: 8px;
}
</style>
