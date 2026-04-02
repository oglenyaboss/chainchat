<script setup lang="ts">
withDefaults(defineProps<{
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}>(), {
  color: 'default',
})
</script>

<template>
  <span class="win95-badge" :class="`win95-badge--${color}`">
    <slot />
  </span>
</template>

<style scoped>
.win95-badge {
  font-family: var(--win95-font-ui);
  font-size: 11px;
  padding: 1px 6px;
  display: inline-block;
  border-top: 1px solid var(--win95-shadow);
  border-left: 1px solid var(--win95-shadow);
  border-right: 1px solid var(--win95-highlight);
  border-bottom: 1px solid var(--win95-highlight);
  background: var(--win95-surface);
}

.win95-badge--primary {
  background: var(--win95-selected);
  color: var(--win95-selected-text);
}

.win95-badge--success {
  background: var(--win95-success);
  color: #FFFFFF;
}

.win95-badge--warning {
  background: var(--win95-warning);
  color: #FFFFFF;
}

.win95-badge--danger {
  background: var(--win95-danger);
  color: #FFFFFF;
}
</style>
