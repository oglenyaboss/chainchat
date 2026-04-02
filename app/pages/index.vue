<template>
  <Win95Desktop>
    <template #icons>
      <Win95DesktopIcon
        icon="message-text"
        label="My Chat"
        window-id="chat"
        @open="openApp"
      />
      <Win95DesktopIcon
        icon="blocks"
        label="Block Explorer"
        window-id="explorer"
        @open="openApp"
      />
      <Win95DesktopIcon
        icon="globe"
        label="Network"
        window-id="network"
        @open="openApp"
      />
      <Win95DesktopIcon
        icon="settings-cog"
        label="Settings"
        window-id="settings"
        @open="openApp"
      />
      <Win95DesktopIcon
        icon="info-box"
        label="About ChainChat"
        window-id="about"
        @open="openApp"
      />
    </template>

    <!-- Managed windows rendered from store -->
    <Win95ManagedWindow
      v-for="win in wmStore.windows"
      :key="win.id"
      :win="win"
    >
      <AppsChatContent v-if="win.component === 'chat'" />
      <AppsExplorerContent v-else-if="win.component === 'explorer'" />
      <AppsNetworkContent v-else-if="win.component === 'network'" />
      <AppsSettingsContent v-else-if="win.component === 'settings'" />
      <AppsAboutContent v-else-if="win.component === 'about'" />
    </Win95ManagedWindow>
  </Win95Desktop>
</template>

<script setup lang="ts">
import { useIdentityStore } from '~/stores/identity'
import { useWindowManagerStore } from '~/stores/window-manager'
import { getAppConfig } from '~/lib/app-registry'

definePageMeta({
  layout: 'desktop',
})

const identityStore = useIdentityStore()
const wmStore = useWindowManagerStore()
const router = useRouter()

// Node state machine — runs at desktop level, shared via provide/inject
const stateMachine = useNodeStateMachine()
provide('stateMachine', stateMachine)

onMounted(() => {
  if (!identityStore.isInitialized) {
    router.push('/welcome')
    return
  }
  stateMachine.start()
})

onUnmounted(() => {
  stateMachine.stop()
})

function openApp(id: string): void {
  const config = getAppConfig(id)
  if (!config) return
  wmStore.openWindow(config)
}
</script>
