// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // eslint-disable-next-line node/prefer-global/process
      signalingUrl: process.env.NUXT_PUBLIC_SIGNALING_URL || 'ws://localhost:3001',
    },
  },
})
