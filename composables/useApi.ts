import { useRuntimeConfig } from 'nuxt/app'
import type { Ref } from 'vue'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import { useAuthFetch } from '@/composables/useAuthFetch'
import keycloakInstance from '@/keycloak'

const config = useRuntimeConfig()
const BASE_URL_1: string = config.public.apiBaseUrl1 as string
const BASE_URL_2: string = config.public.apiBaseUrl2 as string

// --- Interface Definitions ---

interface PasswordPayload {
  oldPassword: string
  newPassword: string
}

interface ApiErrorDetail {
  message: string
  details?: any
}

interface ApiErrorResponse {
  success: false
  code: number
  error: ApiErrorDetail
  message?: string
}

export function useCivitasApi() {
  const loading = ref(false)
  const error: Ref<string | null> = ref(null)
  const errorResponse: Ref<ApiErrorResponse | null> = ref(null)
  const keycloakStore = useKeycloakStore()

  // Add baseUrl param, default to BASE_URL_1
  const fetchWithAuth = async <T = any>(
    endpoint: string,
    options: Record<string, any> = {},
    baseUrl: string = BASE_URL_1,
  ) => {
    loading.value = true
    error.value = null
    errorResponse.value = null

    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

    const responseData: Ref<T | null> = ref(null)
    const errorRef: Ref<any | null> = ref(null)

    const currentTime = Math.floor(Date.now() / 1000)
    const tokenExp = keycloakInstance.tokenParsed?.exp ?? 0
    const timeRemaining = tokenExp - currentTime

    if (keycloakStore.accessToken && timeRemaining < 5) {
      console.log('Token hampir expired, mencoba refresh...')
      await keycloakStore.updateToken()
    }

    try {
      const { data, error: fetchError } = await useAuthFetch<T | ApiErrorResponse>(url, options)

      responseData.value = data.value as T | null
      errorRef.value = fetchError

      if (fetchError.value) {
        const errorData = fetchError.value.data as ApiErrorResponse

        errorResponse.value = errorData

        if (errorData?.error?.message)
          error.value = errorData.error.message
        else if (errorData?.message)
          error.value = errorData.message
        else
          error.value = fetchError.value.message || 'An error occurred during fetch'

        console.error('API call error details:', fetchError.value)
      }
    }
    catch (err: any) {
      error.value = err.message || 'An unexpected network or setup error occurred'
      console.error('API call exception:', err)
      errorResponse.value = {
        success: false,
        code: 0,
        error: { message: error.value || 'Unknown error' },
      }
      errorRef.value = { message: error.value }
    }
    finally {
      loading.value = false
    }

    return {
      response: responseData,
      error: errorRef,
      fetchError: error,
      errorResponse,
    }
  }

  // Grouped API endpoints, specify baseUrl as needed
  const api = {
    staf: {
      getStafData: (stafNIP: number) =>
        fetchWithAuth(`/staf/${stafNIP}`), // uses BASE_URL_1 by default
    },
    dosen: {
      getListDosen: () =>
        fetchWithAuth('/listdosen'), // uses BASE_URL_1 by default
    },
    user: {
      getRiwayatAkademik: () => fetchWithAuth('/my/ac', {}, BASE_URL_1), // explicitly BASE_URL_1
      getProfile: () => fetchWithAuth('/me', {}, BASE_URL_1),

      // getParkirAktif: () => fetchWithAuth('/my/parkir/aktif', {}, BASE_URL_2), // uses BASE_URL_2
      // getParkirHistory: () => fetchWithAuth('/my/parkir/aktif', {}, BASE_URL_2), // uses BASE_URL_2
      getParkirAktif: () =>
        fetchWithAuth('/subscription/active', {
          method: 'GET',
        }, BASE_URL_2),
      getMyParkingHistory: (params?: URLSearchParams) => {
        const queryString = params ? `?${params.toString()}` : ''

        return fetchWithAuth(`/parking-history${queryString}`, {
          method: 'GET',
        }, BASE_URL_2)
      },

      getAttendance: () => fetchWithAuth('/my/hr/attendance', {}, BASE_URL_1),
      getLib: () => fetchWithAuth('/my/lib', {}, BASE_URL_1),
      changePassword: (payload: PasswordPayload) =>
        fetchWithAuth('/my/pw', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        }, BASE_URL_1),
      getAcademicStatus: () => fetchWithAuth('/my/ac/st', {}, BASE_URL_1),
    },
  }

  return {
    api,
    loading,
    error,
    errorResponse,
  }
}
