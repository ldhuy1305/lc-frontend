// export default defineNuxtRouteMiddleware((to, from) => {
//   if (process.server) return 
//   const accessToken = localStorage.getItem('access_token')
//   if (!accessToken) {
//     return navigateTo('/login')
//   }
// })

export default defineNuxtRouteMiddleware((to, from) => {
  if (process.server) return

  const accessToken = localStorage.getItem('access_token')
  if (!accessToken) {
    // redirect cứng, load lại page -> login page render đầy đủ
    window.location.href = '/login'
  }
})

