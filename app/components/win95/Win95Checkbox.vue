<template>
  <label class="win95-checkbox">
    <input
      type="checkbox"
      :checked="modelValue"
      class="win95-checkbox__input"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="win95-checkbox__box">
      <span v-if="modelValue" class="win95-checkbox__check">&#10003;</span>
    </span>
    <span v-if="label" class="win95-checkbox__label">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label?: string
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.win95-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-family: var(--win95-font-ui);
  font-size: 12px;
}

.win95-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.win95-checkbox__box {
  width: 13px;
  height: 13px;
  background: var(--win95-input-bg);
  border-top: 2px solid var(--win95-shadow);
  border-left: 2px solid var(--win95-shadow);
  border-right: 2px solid var(--win95-highlight);
  border-bottom: 2px solid var(--win95-highlight);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.win95-checkbox__check {
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.win95-checkbox__input:focus-visible + .win95-checkbox__box {
  outline: 1px dotted var(--win95-text);
  outline-offset: 2px;
}
</style>
