import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'
import { useKeycloakStore } from '~/@core/stores/keycloakStore'

export default defineNuxtRouteMiddleware(to => {
  const keycloakStore = useKeycloakStore()

  if (process.client) {
    const loginPages = ['/login', '/login-v1', '/login-v2', '/login-v3', '/login-v4', '/login-v5', '/login-v6']
    const isLoginPage = loginPages.includes(to.path)

    // Redirect khusus untuk root path "/"
    if (to.path === '/') {
      if (keycloakStore.authenticated)
        return navigateTo('/profile')
      else
        return navigateTo('/login')
    }

    // Jika belum login dan bukan menuju halaman login, redirect ke /login
    if (!keycloakStore.authenticated && !isLoginPage)
      return navigateTo('/login')

    // Jika sudah login dan mencoba mengakses halaman login, redirect ke /profile
    if (keycloakStore.authenticated && isLoginPage)
      return navigateTo('/profile')
  }
})
