<template>
  <div class="win95-desktop-layout">
    <slot />
    <Win95Taskbar />
  </div>
</template>

<style scoped>
.win95-desktop-layout {
  height: 100vh;
  background: var(--win95-desktop);
}
</style>
