<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  size?: number
}>(), {
  size: 24,
})

const ICON_MAP: Readonly<Record<string, string>> = {
  'message-text': '/win95icons/message-text.svg',
  'blocks': '/win95icons/blocks.svg',
  'globe': '/win95icons/globe.svg',
  'settings-cog': '/win95icons/settings-cog.svg',
  'info-box': '/win95icons/info-box.svg',
  'app-windows': '/win95icons/app-windows.svg',
  'monitor': '/win95icons/monitor.svg',
  'computer': '/win95icons/computer.svg',
  'wifi': '/win95icons/wifi.svg',
  'reload': '/win95icons/reload.svg',
  'check': '/win95icons/check.svg',
  'zap': '/win95icons/zap.svg',
  'coins': '/win95icons/coins.svg',
}

const iconSrc = computed(() => ICON_MAP[props.name] ?? '')
</script>

<template>
  <img
    v-if="iconSrc"
    :src="iconSrc"
    :width="size"
    :height="size"
    :alt="name"
    class="win95-icon"
    draggable="false"
  >
  <span v-else :style="{ width: `${size}px`, height: `${size}px` }" class="win95-icon win95-icon--missing" />
</template>

<style scoped>
.win95-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.win95-icon--missing {
  display: inline-block;
}
</style>
