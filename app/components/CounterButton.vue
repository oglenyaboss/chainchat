<template>
  <UButton color="info" variant="outline" @click="onClick">{{ model }}</UButton>
</template>

<script setup lang="ts">
const props = defineProps<{
  autoResetInterval?: number
}>()

const emit = defineEmits<{
  click: [value: number]
}>()

const model = defineModel<number>({ required: true })

function onClick() {
  model.value++
  emit('click', model.value)
}

let interval: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  console.log('CounterButton mounted')
  if (props.autoResetInterval == undefined) {
    return
  }
  interval = setInterval(() => (model.value = 0), props.autoResetInterval)
})

onUnmounted(() => {
  console.log('CounterButton unmounted')
  clearInterval(interval)
})
</script>
