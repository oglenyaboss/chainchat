export default defineNuxtPlugin(() => {
  const startedAt = new Date().toISOString()

  return {
    provide: {
      appInfo: {
        name: 'LozhkinLN Lab App',
        version: '1.0.0',
        startedAt,
      },
    },
  }
})
