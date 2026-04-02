<template>
  <div class="win95-layout">
    <div class="win95-layout__content">
      <Win95Window
        :title="pageTitle"
        maximized
        :active="true"
      >
        <slot />
      </Win95Window>
    </div>
    <Win95Taskbar />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/chat': 'ChainChat - Broadcast',
    '/explorer': 'Block Explorer',
    '/network': 'Network Topology',
    '/settings': 'Settings',
    '/welcome': 'ChainChat Setup Wizard',
  }
  return titles[route.path] ?? 'ChainChat'
})
</script>

<style scoped>
.win95-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--win95-desktop);
  padding-bottom: var(--win95-taskbar-height);
}

.win95-layout__content {
  flex: 1;
  display: flex;
  padding: 2px;
  overflow: hidden;
}
</style>
