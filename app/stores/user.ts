import { defineStore } from 'pinia'

export interface User {
  uuid: string
  name: string
  role: string
}

export const useUserStore = defineStore(
  'user',
  () => {
    const users = ref<User[]>([])

    function create(user: User) {
      users.value.push(user)
    }

    function update(updatedUser: User) {
      const index = users.value.findIndex(u => u.uuid === updatedUser.uuid)
      if (index !== -1) {
        users.value[index] = updatedUser
      }
    }

    function remove(uuid: string) {
      const index = users.value.findIndex(u => u.uuid === uuid)
      if (index !== -1) {
        users.value.splice(index, 1)
      }
    }

    return { users, create, update, delete: remove }
  },
  { persist: { storage: piniaPluginPersistedstate.localStorage() } },
)
