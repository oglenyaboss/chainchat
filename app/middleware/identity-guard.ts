import { useIdentityStore } from '~/stores/identity'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const identityStore = useIdentityStore()

  if (!identityStore.isInitialized) {
    return navigateTo('/')
  }
})
