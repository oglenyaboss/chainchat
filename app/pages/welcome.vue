<script setup lang="ts">
import { isValidNameFormat } from '~/lib/name-registry'
import { useIdentityStore } from '~/stores/identity'

definePageMeta({
  layout: 'desktop',
})

const identityStore = useIdentityStore()
const router = useRouter()

const step = ref(0)
const nickname = ref('')
const keysGenerated = ref(false)

const nicknameError = computed(() => {
  if (!nickname.value)
    return null
  if (!isValidNameFormat(nickname.value)) {
    return 'Must be 3-20 characters: letters, numbers, underscores only'
  }
  return null
})

const shortPublicKey = computed(() => {
  try {
    const parsed = JSON.parse(identityStore.publicKey)
    return `x: ${parsed.x}\ny: ${parsed.y}`
  }
  catch {
    return identityStore.publicKey.slice(0, 80)
  }
})

async function nextStep() {
  if (step.value === 1) {
    if (!nickname.value || nicknameError.value)
      return
    identityStore.setNickname(nickname.value)
    await identityStore.initialize()
    keysGenerated.value = true
  }
  step.value = Math.min(step.value + 1, 3)
}

function prevStep() {
  step.value = Math.max(step.value - 1, 0)
}

function finish() {
  router.push('/chat')
}
</script>

<template>
  <div class="welcome-wrapper">
    <div class="welcome-dialog">
      <Win95Window title="ChainChat Setup Wizard" :active="true">
        <div class="wizard">
          <!-- Header -->
          <div class="wizard__header">
            <div class="wizard__header-icon">
              &#128187;
            </div>
            <div class="wizard__header-text">
              <template v-if="step === 0">
                Welcome to ChainChat
              </template>
              <template v-else-if="step === 1">
                Choose Your Nickname
              </template>
              <template v-else-if="step === 2">
                Generate Identity
              </template>
              <template v-else-if="step === 3">
                Setup Complete!
              </template>
            </div>
          </div>

          <Win95Divider />

          <!-- Progress -->
          <div class="wizard__progress">
            <Win95ProgressBar :value="(step + 1) * 25" :max="100" />
            <span class="wizard__progress-text">Step {{ step + 1 }} of 4</span>
          </div>

          <!-- Step content -->
          <div class="wizard__body">
            <!-- Step 0: Welcome -->
            <div v-if="step === 0" class="wizard__step">
              <p>Welcome to <strong>ChainChat</strong> — a decentralized P2P blockchain messenger.</p>
              <p class="wizard__hint">
                This wizard will help you set up your identity and connect to the network.
              </p>
              <p class="wizard__hint">
                Every message is a blockchain transaction. Every browser mines blocks.
              </p>
            </div>

            <!-- Step 1: Nickname -->
            <div v-if="step === 1" class="wizard__step">
              <Win95FormField label="Enter your nickname:">
                <Win95Input v-model="nickname" placeholder="CryptoAnon" />
              </Win95FormField>
              <p v-if="nicknameError" class="wizard__error">
                {{ nicknameError }}
              </p>
              <p class="wizard__hint">
                3-20 characters, letters, numbers, underscores.
              </p>
              <p class="wizard__hint">
                Your nickname will be registered on the blockchain — no one else can claim it.
              </p>
            </div>

            <!-- Step 2: Generate Keys -->
            <div v-if="step === 2" class="wizard__step">
              <p v-if="!keysGenerated">
                Generating your cryptographic identity...
              </p>
              <div v-else>
                <p>&#10003; Identity generated successfully!</p>
                <Win95FormField label="Your Peer ID:">
                  <Win95Input :model-value="identityStore.peerId" readonly />
                </Win95FormField>
                <Win95FormField label="Public Key:">
                  <Win95Textarea :model-value="shortPublicKey" readonly :rows="2" />
                </Win95FormField>
              </div>
            </div>

            <!-- Step 3: Done -->
            <div v-if="step === 3" class="wizard__step">
              <p>&#127881; <strong>ChainChat is ready!</strong></p>
              <p class="wizard__hint">
                Click "Finish" to enter the network and start chatting.
              </p>
              <p class="wizard__hint">
                Your identity is stored in this browser session.
              </p>
            </div>
          </div>

          <Win95Divider />

          <!-- Navigation buttons -->
          <div class="wizard__footer">
            <Win95Button :disabled="step === 0" @click="prevStep">
              &lt; Back
            </Win95Button>
            <Win95Button v-if="step < 3" variant="primary" @click="nextStep">
              Next &gt;
            </Win95Button>
            <Win95Button v-else variant="primary" @click="finish">
              Finish
            </Win95Button>
          </div>
        </div>
      </Win95Window>
    </div>
  </div>
</template>

<style scoped>
.welcome-wrapper {
  position: fixed;
  inset: 0;
  bottom: var(--win95-taskbar-height);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--win95-desktop);
}

.welcome-dialog {
  width: 440px;
}

.wizard {
  padding: 8px;
}

.wizard__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
}

.wizard__header-icon {
  font-size: 36px;
}

.wizard__header-text {
  font-family: var(--win95-font-ui);
  font-size: 14px;
  font-weight: 700;
}

.wizard__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
}

.wizard__progress-text {
  font-size: 11px;
  color: var(--win95-dark-shadow);
  white-space: nowrap;
}

.wizard__body {
  min-height: 120px;
  padding: 12px 8px;
}

.wizard__step {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--win95-font-ui);
  font-size: 12px;
  line-height: 1.6;
}

.wizard__hint {
  color: var(--win95-dark-shadow);
  font-size: 11px;
}

.wizard__error {
  color: var(--win95-danger, #cc0000);
  font-size: 11px;
  font-weight: 700;
}

.wizard__footer {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding: 4px 8px 8px;
}
</style>
