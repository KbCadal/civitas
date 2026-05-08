import { useAuthFetch } from '@/composables/useAuthFetch'

export default function useApplications() {
  // useAuthFetch attaches Keycloak access token automatically
  // ensure this runs on client only so Keycloak client token is available
  const { data, pending, error, refresh } = useAuthFetch('/api/applications', { server: false })

  const applications = computed(() => data.value?.applications ?? [])

  return {
    applications,
    pending,
    error,
    refresh,
  }
}
