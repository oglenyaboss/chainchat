<script setup lang="ts">
defineProps<{
  tabs: { id: string, label: string }[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [id: string]
}>()
</script>

<template>
  <div class="win95-tabs">
    <div class="win95-tabs__header">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="win95-tabs__tab"
        :class="{ 'win95-tabs__tab--active': modelValue === tab.id }"
        @click="$emit('update:modelValue', tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="win95-tabs__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.win95-tabs {
  display: flex;
  flex-direction: column;
}

.win95-tabs__header {
  display: flex;
  gap: 0;
  padding-left: 4px;
}

.win95-tabs__tab {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  padding: 4px 12px;
  background: var(--win95-surface);
  border-top: 2px solid var(--win95-highlight);
  border-left: 2px solid var(--win95-highlight);
  border-right: 2px solid var(--win95-dark-shadow);
  border-bottom: none;
  cursor: pointer;
  position: relative;
  top: 2px;
  margin-right: 2px;
  z-index: 0;
}

.win95-tabs__tab--active {
  z-index: 2;
  border-bottom: 2px solid var(--win95-surface);
  margin-bottom: -2px;
  padding-bottom: 6px;
  font-weight: 700;
}

.win95-tabs__content {
  border-top: 2px solid var(--win95-highlight);
  border-left: 2px solid var(--win95-highlight);
  border-right: 2px solid var(--win95-dark-shadow);
  border-bottom: 2px solid var(--win95-dark-shadow);
  background: var(--win95-surface);
  padding: 12px;
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
