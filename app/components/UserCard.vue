<template>
  <UCard
    :class="{ 'ring-2 ring-primary': selected }"
    class="cursor-pointer transition-all"
    @click="onSelect"
  >
    <div class="flex items-center gap-4">
      <UAvatar :text="initials" size="lg" />
      <div>
        <h3 class="text-lg font-semibold">{{ name }}</h3>
        <p class="text-sm text-gray-500">{{ role }}</p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string
  role: string
}>()

const emit = defineEmits<{
  select: [name: string]
}>()

const selected = defineModel<boolean>('selected', { default: false })

const initials = computed(() =>
  props.name.split(' ').map(n => n[0]).join('').toUpperCase()
)

function onSelect() {
  selected.value = !selected.value
  emit('select', props.name)
}

watch(selected, (newVal) => {
  console.log(`UserCard "${props.name}" selected: ${newVal}`)
})
</script>
