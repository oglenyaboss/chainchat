<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :readonly="readonly"
    :rows="rows"
    class="win95-textarea"
    :class="{ 'win95-textarea--readonly': readonly }"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string
  placeholder?: string
  readonly?: boolean
  rows?: number
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.win95-textarea {
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
  resize: vertical;
}

.win95-textarea::placeholder {
  color: var(--win95-shadow);
}

.win95-textarea--readonly {
  background: var(--win95-surface);
}
</style>
