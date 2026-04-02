<script setup lang="ts">
import { getAppConfig } from '~/lib/app-registry'
import { useWindowManagerStore } from '~/stores/window-manager'

definePageMeta({
  layout: 'desktop',
})

const wmStore = useWindowManagerStore()
const router = useRouter()

onMounted(() => {
  const config = getAppConfig('network')
  if (config)
    wmStore.openWindow(config)
  router.replace('/')
})
</script>

<template>
  <div />
</template>
