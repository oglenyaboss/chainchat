<script setup lang="ts">
defineProps<{
  open: boolean
  items: { icon: string, label: string, id: string }[]
}>()

const emit = defineEmits<{
  close: []
  select: [id: string]
}>()

function handleClick(id: string): void {
  emit('select', id)
  emit('close')
}

function handleDesktop(): void {
  emit('select', 'desktop')
  emit('close')
}
</script>

<template>
  <div v-if="open" class="win95-startmenu" @click.stop>
    <div class="win95-startmenu__sidebar">
      <span class="win95-startmenu__sidebar-text">ChainChat</span>
    </div>
    <div class="win95-startmenu__items">
      <button
        v-for="item in items"
        :key="item.id"
        class="win95-startmenu__item"
        @click="handleClick(item.id)"
      >
        <span class="win95-startmenu__item-icon">
          <Win95Icon :name="item.icon" :size="16" />
        </span>
        <span class="win95-startmenu__item-label">{{ item.label }}</span>
      </button>
      <div class="win95-startmenu__divider" />
      <button class="win95-startmenu__item" @click="handleDesktop">
        <span class="win95-startmenu__item-icon">
          <Win95Icon name="monitor" :size="16" />
        </span>
        <span class="win95-startmenu__item-label">Desktop</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.win95-startmenu {
  position: absolute;
  bottom: 100%;
  left: 0;
  display: flex;
  background: var(--win95-surface);
  border-top: 2px solid var(--win95-highlight);
  border-left: 2px solid var(--win95-highlight);
  border-right: 2px solid var(--win95-dark-shadow);
  border-bottom: 2px solid var(--win95-dark-shadow);
  box-shadow: 2px 2px 0 var(--win95-text);
  z-index: 1000;
  min-width: 200px;
}

.win95-startmenu__sidebar {
  width: 24px;
  background: linear-gradient(to top, var(--win95-titlebar), #1084D0);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
}

.win95-startmenu__sidebar-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  color: var(--win95-titlebar-text);
  font-family: var(--win95-font-ui);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
}

.win95-startmenu__items {
  flex: 1;
  padding: 4px 0;
}

.win95-startmenu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  font-family: var(--win95-font-ui);
  font-size: 12px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--win95-text);
}

.win95-startmenu__item:hover {
  background: var(--win95-selected);
  color: var(--win95-selected-text);
}

.win95-startmenu__item-icon {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.win95-startmenu__divider {
  border-top: 1px solid var(--win95-shadow);
  border-bottom: 1px solid var(--win95-highlight);
  margin: 4px 4px;
}
</style>
