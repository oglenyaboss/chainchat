<template>
  <button
    :class="[
      'win95-btn',
      { 'win95-btn--primary': variant === 'primary' },
      { 'win95-btn--disabled': disabled },
    ]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'default' | 'primary'
  disabled?: boolean
}>()
</script>

<style scoped>
.win95-btn {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  padding: 4px 16px;
  min-width: 75px;
  min-height: 23px;
  background: var(--win95-button-face);
  color: var(--win95-text);
  border-top: 2px solid var(--win95-highlight);
  border-left: 2px solid var(--win95-highlight);
  border-right: 2px solid var(--win95-dark-shadow);
  border-bottom: 2px solid var(--win95-dark-shadow);
  box-shadow: inset -1px -1px 0 var(--win95-shadow);
  cursor: pointer;
  outline: none;
  white-space: nowrap;
}

.win95-btn:active:not(:disabled) {
  border-top: 2px solid var(--win95-dark-shadow);
  border-left: 2px solid var(--win95-dark-shadow);
  border-right: 2px solid var(--win95-highlight);
  border-bottom: 2px solid var(--win95-highlight);
  box-shadow: inset 1px 1px 0 var(--win95-shadow);
  padding: 5px 15px 3px 17px;
}

.win95-btn:focus-visible {
  outline: 1px dotted var(--win95-text);
  outline-offset: -4px;
}

.win95-btn--primary {
  outline: 2px solid var(--win95-text);
  outline-offset: -1px;
}

.win95-btn--disabled {
  color: var(--win95-shadow);
  text-shadow: 1px 1px 0 var(--win95-highlight);
  cursor: default;
}
</style>
