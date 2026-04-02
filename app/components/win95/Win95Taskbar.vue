<script setup lang="ts">
import { APP_REGISTRY, getAppConfig } from '~/lib/app-registry'
import { useNodeStateStore } from '~/stores/node-state'
import { usePeerStore } from '~/stores/peers'
import { useWindowManagerStore } from '~/stores/window-manager'

const nodeState = useNodeStateStore()
const peerStore = usePeerStore()
const wmStore = useWindowManagerStore()

const startMenuOpen = ref(false)

const menuItems = APP_REGISTRY
  .filter(app => app.id !== 'about')
  .map(app => ({ icon: app.icon, label: app.title.split(' - ')[0] ?? app.title, id: app.id }))

function handleMenuSelect(id: string): void {
  if (id === 'desktop') {
    for (const win of wmStore.windows) {
      if (!win.minimized)
        wmStore.minimizeWindow(win.id)
    }
    return
  }

  const config = getAppConfig(id)
  if (config) {
    wmStore.openWindow(config)
  }
}

const stateIcon = computed(() => {
  const icons: Record<string, string> = {
    INIT: 'computer',
    CONNECTING: 'wifi',
    SYNCING: 'reload',
    READY: 'check',
    MINING: 'zap',
  }
  return icons[nodeState.state] ?? 'computer'
})

const clock = ref('')

function updateClock(): void {
  clock.value = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

let clockInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateClock()
  clockInterval = setInterval(updateClock, 10_000)
  document.addEventListener('click', closeStartMenu)
})

onUnmounted(() => {
  if (clockInterval)
    clearInterval(clockInterval)
  document.removeEventListener('click', closeStartMenu)
})

function closeStartMenu(): void {
  startMenuOpen.value = false
}
</script>

<template>
  <div class="win95-taskbar">
    <div class="win95-taskbar__inner">
      <!-- Start Button -->
      <div class="win95-taskbar__start-wrapper">
        <button
          class="win95-taskbar__start"
          :class="{ 'win95-taskbar__start--active': startMenuOpen }"
          @click.stop="startMenuOpen = !startMenuOpen"
        >
          <Win95Icon name="app-windows" :size="14" class="win95-taskbar__start-icon" />
          <span class="win95-taskbar__start-label">Start</span>
        </button>
        <Win95StartMenu
          :open="startMenuOpen"
          :items="menuItems"
          @close="startMenuOpen = false"
          @select="handleMenuSelect"
        />
      </div>

      <!-- Divider -->
      <div class="win95-taskbar__divider" />

      <!-- Window buttons (from window manager) -->
      <div class="win95-taskbar__windows">
        <button
          v-for="win in wmStore.windows"
          :key="win.id"
          class="win95-taskbar__window-btn"
          :class="{ 'win95-taskbar__window-btn--active': wmStore.activeWindowId === win.id && !win.minimized }"
          @click="wmStore.toggleMinimize(win.id)"
        >
          <Win95Icon :name="win.icon" :size="12" class="win95-taskbar__window-icon" />
          {{ win.title }}
        </button>
      </div>

      <!-- System Tray -->
      <div class="win95-taskbar__tray">
        <div class="win95-taskbar__tray-inner">
          <span class="win95-taskbar__tray-status" :title="nodeState.state">
            <Win95Icon :name="stateIcon" :size="13" />
          </span>
          <span class="win95-taskbar__tray-peers">{{ peerStore.peerCount }}p</span>
          <span class="win95-taskbar__tray-clock">{{ clock }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.win95-taskbar {
  height: var(--win95-taskbar-height);
  background: var(--win95-surface);
  border-top: 2px solid var(--win95-highlight);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.win95-taskbar__inner {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 2px 4px;
  gap: 4px;
}

.win95-taskbar__start-wrapper {
  position: relative;
}

.win95-taskbar__start {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-family: var(--win95-font-ui);
  font-size: 12px;
  font-weight: 700;
  background: var(--win95-button-face);
  border-top: 2px solid var(--win95-highlight);
  border-left: 2px solid var(--win95-highlight);
  border-right: 2px solid var(--win95-dark-shadow);
  border-bottom: 2px solid var(--win95-dark-shadow);
  cursor: pointer;
  height: 28px;
}

.win95-taskbar__start:active,
.win95-taskbar__start--active {
  border-top: 2px solid var(--win95-dark-shadow);
  border-left: 2px solid var(--win95-dark-shadow);
  border-right: 2px solid var(--win95-highlight);
  border-bottom: 2px solid var(--win95-highlight);
}

.win95-taskbar__start-icon {
  display: flex;
  align-items: center;
}

.win95-taskbar__divider {
  width: 2px;
  height: 24px;
  border-left: 1px solid var(--win95-shadow);
  border-right: 1px solid var(--win95-highlight);
}

.win95-taskbar__windows {
  flex: 1;
  display: flex;
  gap: 2px;
  overflow: hidden;
}

.win95-taskbar__window-btn {
  font-family: var(--win95-font-ui);
  font-size: 11px;
  padding: 2px 8px;
  min-width: 120px;
  max-width: 200px;
  height: 26px;
  background: var(--win95-button-face);
  border-top: 2px solid var(--win95-highlight);
  border-left: 2px solid var(--win95-highlight);
  border-right: 2px solid var(--win95-dark-shadow);
  border-bottom: 2px solid var(--win95-dark-shadow);
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
}

.win95-taskbar__window-btn--active {
  border-top: 2px solid var(--win95-dark-shadow);
  border-left: 2px solid var(--win95-dark-shadow);
  border-right: 2px solid var(--win95-highlight);
  border-bottom: 2px solid var(--win95-highlight);
  font-weight: 700;
  background: repeating-conic-gradient(var(--win95-surface) 0% 25%, #FFFFFF 0% 50%) 50% / 2px 2px;
}

.win95-taskbar__window-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.win95-taskbar__tray {
  margin-left: auto;
  border-top: 2px solid var(--win95-shadow);
  border-left: 2px solid var(--win95-shadow);
  border-right: 2px solid var(--win95-highlight);
  border-bottom: 2px solid var(--win95-highlight);
  padding: 2px 8px;
  height: 28px;
}

.win95-taskbar__tray-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--win95-font-ui);
  font-size: 11px;
  height: 100%;
}

.win95-taskbar__tray-status {
  font-size: 13px;
  cursor: default;
}

.win95-taskbar__tray-peers {
  color: var(--win95-dark-shadow);
}

.win95-taskbar__tray-clock {
  color: var(--win95-text);
}
</style>
