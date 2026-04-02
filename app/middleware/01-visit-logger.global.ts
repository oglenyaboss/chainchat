export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const visitCount = useState('visitCount', () => 0)
  visitCount.value++

  const { $logger } = useNuxtApp()
  $logger.info(`Переход на ${to.path} (визит #${visitCount.value})`)
})
