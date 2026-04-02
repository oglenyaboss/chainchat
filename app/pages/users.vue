<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Пользователи</h1>

    <div class="flex flex-col gap-4">
      <div v-for="user in userStore.users" :key="user.uuid" class="flex items-center gap-4">
        <UAvatar :text="user.name.split(' ').map(n => n[0]).join('').toUpperCase()" size="lg" />
        <UInput v-model="user.name" @update:model-value="() => userStore.update(user)" />
        <UInput v-model="user.role" @update:model-value="() => userStore.update(user)" />
        <UButton color="error" @click="userStore.delete(user.uuid)">Удалить</UButton>
      </div>
    </div>

    <div class="mt-6 flex gap-2">
      <UInput v-model="newName" placeholder="Имя" />
      <UInput v-model="newRole" placeholder="Роль" />
      <UButton @click="onCreate">Добавить</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const newName = ref('')
const newRole = ref('')

if (userStore.users.length === 0) {
  userStore.$patch({
    users: [
      { uuid: crypto.randomUUID(), name: 'Иван Петров', role: 'Разработчик' },
      { uuid: crypto.randomUUID(), name: 'Мария Сидорова', role: 'Дизайнер' },
      { uuid: crypto.randomUUID(), name: 'Алексей Козлов', role: 'Менеджер' },
    ],
  })
}

userStore.$subscribe((mutation, state) => {
  console.log('User store changed:', state.users)
})

function onCreate() {
  if (!newName.value.trim()) return
  userStore.create({ uuid: crypto.randomUUID(), name: newName.value, role: newRole.value })
  newName.value = ''
  newRole.value = ''
}
</script>
