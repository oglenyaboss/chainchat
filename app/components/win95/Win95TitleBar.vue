<template>
  <div class="win95-titlebar" :class="{ 'win95-titlebar--inactive': !active }">
    <span class="win95-titlebar__title">{{ title }}</span>
    <div class="win95-titlebar__controls">
      <button v-if="minimizable" class="win95-titlebar__btn" @click="$emit('minimize')">
        <span class="win95-titlebar__icon">&#9472;</span>
      </button>
      <button v-if="maximizable" class="win95-titlebar__btn" @click="$emit('maximize')">
        <span class="win95-titlebar__icon">&#9744;</span>
      </button>
      <button v-if="closable" class="win95-titlebar__btn win95-titlebar__btn--close" @click="$emit('close')">
        <span class="win95-titlebar__icon">&times;</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  active?: boolean
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
}>(), {
  active: true,
  closable: false,
  minimizable: false,
  maximizable: false,
})

defineEmits<{
  minimize: []
  maximize: []
  close: []
}>()
</script>

<style scoped>
.win95-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 3px;
  background: linear-gradient(90deg, var(--win95-titlebar) 0%, #1084D0 100%);
  user-select: none;
  height: 22px;
}

.win95-titlebar--inactive {
  background: linear-gradient(90deg, var(--win95-titlebar-inactive) 0%, #B5B5B5 100%);
}

.win95-titlebar__title {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  font-weight: 700;
  color: var(--win95-titlebar-text);
  padding-left: 2px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.win95-titlebar__controls {
  display: flex;
  gap: 2px;
}

.win95-titlebar__btn {
  width: 16px;
  height: 14px;
  background: var(--win95-button-face);
  border-top: 1px solid var(--win95-highlight);
  border-left: 1px solid var(--win95-highlight);
  border-right: 1px solid var(--win95-dark-shadow);
  border-bottom: 1px solid var(--win95-dark-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-size: 10px;
  line-height: 1;
}

.win95-titlebar__btn:active {
  border-top: 1px solid var(--win95-dark-shadow);
  border-left: 1px solid var(--win95-dark-shadow);
  border-right: 1px solid var(--win95-highlight);
  border-bottom: 1px solid var(--win95-highlight);
}

.win95-titlebar__icon {
  color: var(--win95-text);
  font-weight: 700;
  line-height: 1;
}
</style>
