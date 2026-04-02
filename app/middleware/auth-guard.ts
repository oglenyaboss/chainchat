export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const isAuth = useState('isAuthenticated', () => false)

  if (!isAuth.value) {
    return navigateTo('/')
  }
})
