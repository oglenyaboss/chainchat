<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Защищённая страница</h1>
    <UAlert
      title="Доступ разрешён"
      description="Вы авторизованы и можете видеть эту страницу."
      color="success"
      variant="subtle"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth-guard'],
})
</script>
