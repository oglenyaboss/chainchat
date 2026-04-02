<template>
  <input
    :value="modelValue"
    :placeholder="placeholder"
    :readonly="readonly"
    :disabled="disabled"
    :type="type"
    class="win95-input"
    :class="{ 'win95-input--readonly': readonly }"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string | number
  placeholder?: string
  readonly?: boolean
  disabled?: boolean
  type?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.win95-input {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  padding: 3px 4px;
  background: var(--win95-input-bg);
  color: var(--win95-text);
  border-top: 2px solid var(--win95-shadow);
  border-left: 2px solid var(--win95-shadow);
  border-right: 2px solid var(--win95-highlight);
  border-bottom: 2px solid var(--win95-highlight);
  box-shadow: inset -1px -1px 0 var(--win95-highlight), inset 1px 1px 0 var(--win95-dark-shadow);
  outline: none;
  width: 100%;
}

.win95-input::placeholder {
  color: var(--win95-shadow);
}

.win95-input--readonly {
  background: var(--win95-surface);
}

.win95-input:disabled {
  background: var(--win95-surface);
  color: var(--win95-shadow);
}
</style>
