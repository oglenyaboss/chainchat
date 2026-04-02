export default defineNuxtRouteMiddleware((to) => {
  console.log(`Именованный middleware: переход на ${to.path}`)
})
