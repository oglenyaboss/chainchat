<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Статистика</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.label"
        :label="stat.label"
        :percentage="stat.percentage"
        :variant="stat.variant"
        v-model="stat.value"
        @change="(val: string | number) => onStatChange(stat.label, val)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const stats = ref([
  { label: 'Пользователи', value: 1250, percentage: 75, variant: 'primary' as const },
  { label: 'Заказы', value: 340, percentage: 45, variant: 'success' as const },
  { label: 'Ошибки', value: 12, percentage: 15, variant: 'error' as const },
  { label: 'Загрузка', value: 87, percentage: 87, variant: 'warning' as const },
])

function onStatChange(label: string, val: string | number) {
  console.log(`Stat "${label}" changed to: ${val}`)
}
</script>
