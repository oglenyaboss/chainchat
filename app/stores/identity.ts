import { defineStore } from 'pinia'
import { generateKeyPair } from '~/lib/crypto'

export const useIdentityStore = defineStore(
  'identity',
  () => {
    const publicKey = ref<string>('')
    const privateKey = ref<string>('')
    const nickname = ref<string>('')
    const peerId = ref<string>('')

    const isInitialized = computed(() => publicKey.value !== '' && privateKey.value !== '')

    async function initialize() {
      if (isInitialized.value)
        return

      const keyPair = await generateKeyPair()
      publicKey.value = keyPair.publicKey
      privateKey.value = keyPair.privateKey
      peerId.value = crypto.randomUUID()
      nickname.value = `Peer-${peerId.value.slice(0, 6)}`
    }

    function setNickname(name: string) {
      nickname.value = name
    }

    return { publicKey, privateKey, nickname, peerId, isInitialized, initialize, setNickname }
  },
  { persist: { storage: piniaPluginPersistedstate.sessionStorage() } },
)
