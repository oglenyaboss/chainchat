<template>
  <UAlert
    v-if="visible"
    :title="title"
    :description="message"
    :color="type ?? 'info'"
    variant="subtle"
    :close="dismissible"
    @update:open="onOpenChange"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  dismissible?: boolean
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const visible = defineModel<boolean>('visible', { default: true })

function onOpenChange(open: boolean) {
  if (!open) {
    visible.value = false
    emit('dismiss')
  }
}

onMounted(() => {
  console.log(`AlertBox mounted: ${props.title}`)
})

onUnmounted(() => {
  console.log(`AlertBox unmounted: ${props.title}`)
})
</script>
