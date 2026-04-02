<template>
  <UCard class="cursor-pointer" @click="onToggle">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <UBadge color="info" variant="subtle">{{ tag }}</UBadge>
      </div>
    </template>

    <p v-if="expanded" class="text-gray-600">{{ description }}</p>
    <p v-else class="text-gray-400 text-sm">Нажмите, чтобы раскрыть</p>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  tag: string
}>()

const emit = defineEmits<{
  toggle: [expanded: boolean]
}>()

const expanded = defineModel<boolean>('expanded', { default: false })

function onToggle() {
  expanded.value = !expanded.value
  emit('toggle', expanded.value)
}

watch(expanded, (newVal) => {
  console.log(`InfoCard "${props.title}" expanded: ${newVal}`)
})
</script>
