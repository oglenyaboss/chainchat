<template>
  <UCard>
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm text-gray-500">{{ label }}</span>
      <UBadge :color="variant ?? 'primary'" variant="subtle">{{ percentage }}%</UBadge>
    </div>
    <div class="text-3xl font-bold mb-3">{{ value }}</div>
    <UProgress :model-value="percentage" :color="variant ?? 'primary'" />
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  percentage: number
  variant?: 'primary' | 'success' | 'error' | 'warning'
}>()

const emit = defineEmits<{
  change: [value: string | number]
}>()

const value = defineModel<string | number>({ default: 0 })

let interval: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  console.log(`StatCard mounted: ${props.label}`)
  interval = setInterval(() => {
    if (typeof value.value === 'number') {
      value.value = value.value + 1
      emit('change', value.value)
    }
  }, 3000)
})

onUnmounted(() => {
  console.log(`StatCard unmounted: ${props.label}`)
  clearInterval(interval)
})

watch(value, (newVal) => {
  console.log(`StatCard "${props.label}" value: ${newVal}`)
})
</script>
