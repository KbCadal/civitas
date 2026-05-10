import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import keycloakInstance from '@/keycloak'

import { useFetch } from '#app'

export function useAuthFetch<T>(url: string, options?: any) {
  const keycloakStore = useKeycloakStore()
  const buildHeaders = () => {
    const headers = { ...(options?.headers || {}) } as Record<string, string>

    if (keycloakStore.accessToken)
      headers.Authorization = `Bearer ${keycloakStore.accessToken}`

    return headers
  }

  return useFetch<T>(url, {
    ...options,
    headers: buildHeaders(),
    async beforeRequest({ options }: { options: any }) {
      if (!keycloakStore.accessToken)
        return

      const currentTime = Math.floor(Date.now() / 1000)
      const tokenExp = keycloakInstance.tokenParsed?.exp ?? 0
      const timeRemaining = tokenExp - currentTime

      if (timeRemaining < 5) {
        console.log('Token hampir expired, mencoba refresh...')
        await keycloakStore.updateToken()
      }

      options.headers = buildHeaders()
    },
  })
}
