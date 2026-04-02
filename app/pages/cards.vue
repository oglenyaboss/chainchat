<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Карточки</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="card in cardStore.cards" :key="card.uuid">
        <template #header>
          <div class="flex items-center justify-between">
            <UInput v-model="card.title" @update:model-value="() => cardStore.update(card)" />
            <UBadge color="info" variant="subtle">{{ card.tag }}</UBadge>
          </div>
        </template>
        <UTextarea v-model="card.description" @update:model-value="() => cardStore.update(card)" />
        <template #footer>
          <UButton color="error" size="xs" @click="cardStore.delete(card.uuid)">Удалить</UButton>
        </template>
      </UCard>
    </div>

    <div class="mt-6 flex gap-2">
      <UInput v-model="newTitle" placeholder="Название" />
      <UInput v-model="newDescription" placeholder="Описание" />
      <UInput v-model="newTag" placeholder="Тег" />
      <UButton @click="onCreate">Добавить</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCardStore } from '~/stores/card'

const cardStore = useCardStore()
const newTitle = ref('')
const newDescription = ref('')
const newTag = ref('')

if (cardStore.cards.length === 0) {
  cardStore.$patch({
    cards: [
      { uuid: crypto.randomUUID(), title: 'Vue.js', description: 'Прогрессивный JavaScript-фреймворк.', tag: 'Frontend' },
      { uuid: crypto.randomUUID(), title: 'Nuxt', description: 'Фреймворк на основе Vue.', tag: 'Framework' },
      { uuid: crypto.randomUUID(), title: 'TypeScript', description: 'Типизированный надмножество JS.', tag: 'Язык' },
    ],
  })
}

function onCreate() {
  if (!newTitle.value.trim()) return
  cardStore.create({
    uuid: crypto.randomUUID(),
    title: newTitle.value,
    description: newDescription.value,
    tag: newTag.value,
  })
  newTitle.value = ''
  newDescription.value = ''
  newTag.value = ''
}
</script>
