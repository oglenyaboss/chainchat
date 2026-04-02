<template>
  <fieldset class="win95-groupbox">
    <legend v-if="label" class="win95-groupbox__legend">{{ label }}</legend>
    <slot />
  </fieldset>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<style scoped>
.win95-groupbox {
  border: 2px groove var(--win95-surface);
  padding: 8px 12px;
  margin: 0;
}

.win95-groupbox__legend {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  padding: 0 4px;
  background: var(--win95-surface);
}
</style>
