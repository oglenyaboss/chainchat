<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <div class="win95-form-field">
    <label v-if="label" class="win95-form-field__label">{{ label }}</label>
    <slot />
  </div>
</template>

<style scoped>
.win95-form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.win95-form-field__label {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  font-weight: 400;
}
</style>
