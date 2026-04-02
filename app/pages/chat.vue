<template>
  <div />
</template>

<script setup lang="ts">
import { useWindowManagerStore } from '~/stores/window-manager'
import { getAppConfig } from '~/lib/app-registry'

definePageMeta({
  layout: 'desktop',
})

const wmStore = useWindowManagerStore()
const router = useRouter()

onMounted(() => {
  const config = getAppConfig('chat')
  if (config) wmStore.openWindow(config)
  router.replace('/')
})
</script>
