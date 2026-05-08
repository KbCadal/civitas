import { useKeycloakStore } from '@/@core/stores/keycloakStore'

import { useFetch } from '#app'

export function useAuthFetch<T>(url: string, options?: any) {
  const keycloakStore = useKeycloakStore()

  return useFetch<T>(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${keycloakStore.accessToken}`,
    },
    async beforeRequest({ options }: { options: any }) {
      // Cek apakah token hampir expired (less than 5 seconds remaining)

      const currentTime = Math.floor(Date.now() / 1000) // Current time in seconds
      const tokenExp = keycloakStore.keycloakInstance.tokenParsed?.exp ?? 0 // Token expiration time in seconds

      const timeRemaining = tokenExp - currentTime // Time remaining in seconds

      if (timeRemaining < 5) {
        console.log('Token hampir expired, mencoba refresh...')
        await keycloakStore.updateToken() // Refresh the token if it's about to expire
      }

      // Set ulang Authorization header setelah refresh token
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${keycloakStore.accessToken}`,
      }
    },
  })
}
