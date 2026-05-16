import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import { createKeycloakInstance } from '@/keycloak'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  const ssoBaseUrl = config.public.ssoBaseUrl as string

  const keycloakInstance = createKeycloakInstance(ssoBaseUrl)

  const keycloakStore = useKeycloakStore()

  try {
    const authenticated = await keycloakInstance.init({
      onLoad: 'check-sso',
      checkLoginIframe: true,
      checkLoginIframeInterval: 5,
    })

    keycloakStore.authenticated = authenticated

    if (authenticated) {
      keycloakStore.refresh()
      console.log('User is authenticated')

      setInterval(() => {
        const now = Math.floor(Date.now() / 1000)
        const tokenExp = keycloakInstance.refreshTokenParsed?.exp ?? 0

        if (tokenExp <= now) {
          console.warn('Token expired. Logging out...')
          keycloakInstance.logout({
            redirectUri: `${window.location.origin}/login`,
          })
        }
      }, 10_000)
    }
    else {
      console.log('User is not authenticated')
    }
  }
  catch (error) {
    console.error('Keycloak init error:', error)
  }
})
