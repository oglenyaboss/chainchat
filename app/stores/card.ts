import { defineStore } from 'pinia'

export interface Card {
  uuid: string
  title: string
  description: string
  tag: string
}

export const useCardStore = defineStore('card', () => {
  const cards = ref<Card[]>([])

  function create(card: Card) {
    cards.value.push(card)
  }

  function update(updatedCard: Card) {
    const index = cards.value.findIndex(c => c.uuid === updatedCard.uuid)
    if (index !== -1) {
      cards.value[index] = updatedCard
    }
  }

  function remove(uuid: string) {
    const index = cards.value.findIndex(c => c.uuid === uuid)
    if (index !== -1) {
      cards.value.splice(index, 1)
    }
  }

  return { cards, create, update, delete: remove }
})
