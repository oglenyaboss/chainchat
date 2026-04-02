import { defineStore } from 'pinia'

export interface Notification {
  uuid: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  function create(notification: Notification) {
    notifications.value.push(notification)
  }

  function update(updated: Notification) {
    const index = notifications.value.findIndex(n => n.uuid === updated.uuid)
    if (index !== -1) {
      notifications.value[index] = updated
    }
  }

  function remove(uuid: string) {
    const index = notifications.value.findIndex(n => n.uuid === uuid)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  return { notifications, create, update, delete: remove }
})
