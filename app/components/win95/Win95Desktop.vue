<template>
  <div class="win95-desktop" @click="handleDesktopClick">
    <div class="win95-desktop__icons">
      <slot name="icons" />
    </div>
    <div class="win95-desktop__windows">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowManagerStore } from '~/stores/window-manager'

const wmStore = useWindowManagerStore()
const selectedIcon = ref<string | null>(null)

provide('desktopSelectedIcon', selectedIcon)

function handleDesktopClick(): void {
  selectedIcon.value = null
  wmStore.clearFocus()
}
</script>

<style scoped>
.win95-desktop {
  position: fixed;
  inset: 0;
  bottom: var(--win95-taskbar-height);
  background: var(--win95-desktop);
  overflow: hidden;
}

.win95-desktop__icons {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 16px;
  padding: 16px;
  height: 100%;
  pointer-events: none;
}

.win95-desktop__icons > :deep(*) {
  pointer-events: auto;
}

.win95-desktop__windows {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.win95-desktop__windows > :deep(*) {
  pointer-events: auto;
}
</style>
