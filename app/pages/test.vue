<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Тест директив</h1>

    <div
      v-for="(counter, index) in counters"
      :key="counter.uuid"
      class="grid items-center gap-4 py-2"
      style="grid-template-columns: 1fr 45px 45px 100px 45px; max-width: 800px"
    >
      <span class="text-sm text-gray-500 truncate">{{ counter.uuid }}</span>
      <span>
        <span v-show="index % 3 !== 1 || counter.enabled">
          <CounterButton
            v-if="index % 3 !== 0 || counter.enabled"
            v-model="counter.value"
          />
        </span>
      </span>
      <span>
        <UButton color="error" size="xs" @click="onRemove(counter.uuid)">-</UButton>
      </span>
      <span class="text-center text-sm">
        <span v-if="index % 3 === 0">v-if</span>
        <span v-else-if="index % 3 === 1">v-show</span>
        <span v-else>blocked</span>
      </span>
      <span class="flex items-center">
        <USwitch v-model="counter.enabled" :disabled="index % 3 === 2" />
      </span>
    </div>

    <UButton class="mt-4" @click="onAdd">Добавить</UButton>
  </div>
</template>

<script setup lang="ts">
const counters = ref<{ value: number; uuid: string; enabled: boolean }[]>([])

onMounted(() => {
  counters.value = [
    { value: 0, uuid: crypto.randomUUID(), enabled: true },
    { value: 0, uuid: crypto.randomUUID(), enabled: true },
    { value: 0, uuid: crypto.randomUUID(), enabled: true },
    { value: 0, uuid: crypto.randomUUID(), enabled: true },
  ]
})

function onAdd() {
  counters.value = [...counters.value, { value: 0, uuid: crypto.randomUUID(), enabled: true }]
}

function onRemove(uuid: string) {
  counters.value = counters.value.filter(c => c.uuid !== uuid)
}
</script>
