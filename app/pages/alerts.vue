<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Уведомления</h1>

    <div class="flex flex-col gap-4">
      <UAlert
        v-for="n in notificationStore.notifications"
        :key="n.uuid"
        :title="n.title"
        :description="n.message"
        :color="n.type"
        variant="subtle"
        :close="true"
        @update:open="(open: boolean) => { if (!open) notificationStore.delete(n.uuid) }"
      />
    </div>

    <div class="mt-6 flex gap-2 items-end">
      <UInput v-model="newTitle" placeholder="Заголовок" />
      <UInput v-model="newMessage" placeholder="Сообщение" />
      <USelect v-model="newType" :items="types" />
      <UButton @click="onCreate">Добавить</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore, type Notification } from '~/stores/notification'

const notificationStore = useNotificationStore()
const newTitle = ref('')
const newMessage = ref('')
const newType = ref<Notification['type']>('info')

const types = ['info', 'success', 'warning', 'error']

if (notificationStore.notifications.length === 0) {
  notificationStore.$patch({
    notifications: [
      { uuid: crypto.randomUUID(), title: 'Информация', message: 'Это информационное уведомление.', type: 'info' },
      { uuid: crypto.randomUUID(), title: 'Успех', message: 'Операция выполнена успешно.', type: 'success' },
      { uuid: crypto.randomUUID(), title: 'Предупреждение', message: 'Обратите внимание.', type: 'warning' },
      { uuid: crypto.randomUUID(), title: 'Ошибка', message: 'Произошла ошибка.', type: 'error' },
    ],
  })
}

notificationStore.$subscribe((mutation, state) => {
  console.log(`Уведомлений: ${state.notifications.length}`)
})

function onCreate() {
  if (!newTitle.value.trim()) return
  notificationStore.create({
    uuid: crypto.randomUUID(),
    title: newTitle.value,
    message: newMessage.value,
    type: newType.value,
  })
  newTitle.value = ''
  newMessage.value = ''
}
</script>
