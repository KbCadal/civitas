import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import keycloakInstance from '@/keycloak'

// Minimal waktu untuk memperbaharui token (detik)
const MIN_VALIDITY = 60

// State utama
const authenticated = ref(false)
const name = ref<string>('')
const username = ref<string>('')
const preferred_username = ref<string>('')
const civitas = ref<string>('')
const kodeIdentitas = ref<string>('')
const accessToken = ref<string>('')
const tokenParsedExp = ref<number>(0)
const refreshTokenExp = ref<number>(0)
const passwordExp = ref<string>('')
const roles = ref<string[]>([])
const selectedRole = useStorage('selectedRole', 'admin')

//* * Fungsi untuk menyegarkan data dari Keycloak Instance */
const refresh = (): void => {
  authenticated.value = keycloakInstance.authenticated ?? false

  const tokenParsed = keycloakInstance.tokenParsed ?? {}
  const refreshedTokenParsed = keycloakInstance.refreshTokenParsed ?? {}

  name.value = tokenParsed.given_name || ''
  username.value = tokenParsed.preferred_username || ''
  preferred_username.value = tokenParsed.preferred_username || ''
  civitas.value = tokenParsed.civitas || ''
  kodeIdentitas.value = tokenParsed.kodeIdentitas || ''
  tokenParsedExp.value = tokenParsed.exp || 0
  passwordExp.value = tokenParsed.shadowExpire || ''
  accessToken.value = keycloakInstance.token || ''
  refreshTokenExp.value = refreshedTokenParsed.exp || 0
  roles.value = keycloakInstance.resourceAccess?.vueplayground?.roles ?? []
}

//* * Fungsi untuk memperbarui token jika hampir kadaluwarsa  */
const updateToken = async (): Promise<string | null> => {
  try {
    const refreshed = await keycloakInstance.updateToken(MIN_VALIDITY)
    if (refreshed)
      refresh()

    console.log('Token Updated:', accessToken.value)

    return accessToken.value
  }
  catch (error) {
    console.error('Failed to update token:', error)

    return null
  }
}

// ** Decode JWT Payload dengan aman**
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(':')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

    const jsonPayload = atob(base64)
      .split('')
      .map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join('')

    const payload = JSON.parse(decodeURIComponent(jsonPayload))

    console.log('Decoded Payload:', payload)

    const isExpired
            = payload.exp - Math.floor(Date.now() / 1000) - MIN_VALIDITY <= 0

    console.log(isExpired ? 'Token Expired' : 'Token Valid')

    return payload
  }
  catch (error) {
    console.error('Failed to decode JWT:', error)

    return null
  }
}

// ** Getters untuk data turunan **
const isTokenExpired = computed(() => {
  const currentTime = Math.floor(Date.now() / 1000)

  return refreshTokenExp.value - currentTime <= 0
})

//* * Definisikan Store Pinia */
export const useKeycloakStore = defineStore('keycloak', () => {
  return {
    // State
    authenticated,
    name,
    username,
    preferred_username,
    civitas,
    kodeIdentitas,
    accessToken,
    refreshTokenExp,
    roles,
    selectedRole,

    // Constants
    MIN_VALIDITY,

    // Methods
    refresh,
    updateToken,
    decodeJwtPayload,

    // GETTER
    isTokenExpired,
  }
})
