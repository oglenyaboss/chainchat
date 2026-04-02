export function useDateTime() {
  const now = ref(new Date())

  let interval: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    interval = setInterval(() => {
      now.value = new Date()
    }, 1000)
  })

  onUnmounted(() => {
    clearInterval(interval)
  })

  const formatted = computed(() => now.value.toLocaleString('ru-RU'))
  const time = computed(() => now.value.toLocaleTimeString('ru-RU'))
  const date = computed(() => now.value.toLocaleDateString('ru-RU'))

  return { now, formatted, time, date }
}
