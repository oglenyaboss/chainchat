<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  active?: boolean
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  maximized?: boolean
}>(), {
  active: true,
  closable: false,
  minimizable: false,
  maximizable: false,
  maximized: false,
})

defineEmits<{
  minimize: []
  maximize: []
  close: []
}>()
</script>

<template>
  <div class="win95-window" :class="{ 'win95-window--maximized': maximized }">
    <Win95TitleBar
      :title="title"
      :active="active"
      :closable="closable"
      :minimizable="minimizable"
      :maximizable="maximizable"
      @minimize="$emit('minimize')"
      @maximize="$emit('maximize')"
      @close="$emit('close')"
    />
    <div class="win95-window__content">
      <slot />
    </div>
    <div v-if="$slots.statusbar" class="win95-window__statusbar">
      <slot name="statusbar" />
    </div>
  </div>
</template>

<style scoped>
.win95-window {
  background: var(--win95-surface);
  border-top: 2px solid var(--win95-highlight);
  border-left: 2px solid var(--win95-highlight);
  border-right: 2px solid var(--win95-dark-shadow);
  border-bottom: 2px solid var(--win95-dark-shadow);
  box-shadow: 1px 1px 0 var(--win95-text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.win95-window--maximized {
  flex: 1;
  box-shadow: none;
}

.win95-window__content {
  flex: 1;
  overflow: auto;
  padding: 4px;
}

.win95-window__statusbar {
  border-top: 2px solid var(--win95-shadow);
  padding: 2px 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
