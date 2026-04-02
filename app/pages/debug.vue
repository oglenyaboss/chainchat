<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Debug</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">App Info (plugin)</h2>
        </template>
        <div class="space-y-1 text-sm">
          <p><strong>Name:</strong> {{ $appInfo.name }}</p>
          <p><strong>Version:</strong> {{ $appInfo.version }}</p>
          <p><strong>Started:</strong> {{ $appInfo.startedAt }}</p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">Composables</h2>
        </template>
        <div class="space-y-1 text-sm">
          <p><strong>Время:</strong> {{ time }}</p>
          <p><strong>Дата:</strong> {{ date }}</p>
          <p><strong>Визитов:</strong> {{ visitCount }}</p>
        </div>
      </UCard>

      <UCard class="md:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Logger (plugin + composable)</h2>
            <UButton size="xs" color="neutral" variant="outline" @click="onTestLog">Тест лог</UButton>
          </div>
        </template>
        <div class="space-y-1 text-sm max-h-60 overflow-y-auto">
          <div
            v-for="(entry, i) in logger.history.value"
            :key="i"
            class="font-mono"
            :class="{
              'text-blue-600': entry.level === 'info',
              'text-yellow-600': entry.level === 'warn',
              'text-red-600': entry.level === 'error',
            }"
          >
            [{{ entry.time }}] {{ entry.level.toUpperCase() }}: {{ entry.message }}
          </div>
          <p v-if="logger.history.value.length === 0" class="text-gray-400">Пусто</p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">Auth Guard (middleware)</h2>
        </template>
        <div class="space-y-2">
          <p class="text-sm">
            Статус: <UBadge :color="isAuth ? 'success' : 'error'" variant="subtle">
              {{ isAuth ? 'Авторизован' : 'Не авторизован' }}
            </UBadge>
          </p>
          <UButton size="sm" @click="isAuth = !isAuth">
            {{ isAuth ? 'Выйти' : 'Войти' }}
          </UButton>
          <NuxtLink to="/protected">
            <UButton size="sm" color="neutral" variant="outline">Открыть /protected</UButton>
          </NuxtLink>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['log'],
})

const { $appInfo } = useNuxtApp()
const logger = useLogger()
const { time, date } = useDateTime()
const { count: visitCount } = useVisitCounter()
const isAuth = useState('isAuthenticated', () => false)

function onTestLog() {
  logger.info('Тестовое сообщение')
  logger.warn('Тестовое предупреждение')
  logger.error('Тестовая ошибка')
}
</script>
