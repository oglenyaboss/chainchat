import { useIdentityStore } from '~/stores/identity'

export default defineNuxtPlugin(async () => {
  const identityStore = useIdentityStore()
  await identityStore.initialize()
})
