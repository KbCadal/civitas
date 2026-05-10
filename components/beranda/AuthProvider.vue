<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router' // Import Vue Router
import keycloakInstance from '@/keycloak'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'

const router = useRouter() // Inisialisasi router
const config = useRuntimeConfig()
const keycloakStore = useKeycloakStore()
const authEnabled = computed(() => config.public.authEnabled)

function login() {
  if (!authEnabled.value) {
    keycloakStore.setDevSession()
    router.push('/profile')
    return
  }

  keycloakInstance.login({
    redirectUri: `${window.location.origin}/profile`,
  })
}

function loginGoogle() {
  if (!authEnabled.value) {
    keycloakStore.setDevSession()
    router.push('/profile')
    return
  }

  keycloakInstance.login({
    redirectUri: `${window.location.origin}/profile`, idpHint: 'google',
  })
}

// Cek apakah user sudah login saat komponen dimuat
onMounted(() => {
  if (keycloakInstance.authenticated)
    router.push('/profile')
})
</script>

<template>
  <VAlert
    v-if="!authEnabled"
    type="warning"
    variant="tonal"
    class="mb-4 text-start"
  >
    SSO dimatikan lewat feature flag. Halaman ini memakai sesi lokal agar integrasi real bisa diaktifkan lagi nanti lewat env.
  </VAlert>

  <VBtn
    class="sso-btn font-weight-medium"
    color="#3d3d3d"
    prepend-icon="ri-key-fill"
    block
    type="submit"
    rounded="xl"
    @click="login"
  >
    {{ authEnabled ? 'Single Sign On' : 'Masuk ke Profil Lokal' }}
  </VBtn>

  <VBtn
    v-if="authEnabled"
    class="google-btn font-weight-medium"
    color="#3d3d3d"
    prepend-icon="ri-google-fill"
    block
    type="submit"
    rounded="xl"
    variant="outlined"
    style="margin-block-start: 5px;"
    @click="loginGoogle"
  >
    Sign in with Google
  </VBtn>
</template>

<style scoped>
/* Use :deep() correctly to apply styles to the Vuetify button */
.v-btn.sso-btn {
  background-color: #535666 !important; /* semi-transparent dark */
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.v-btn.sso-btn:hover {
  background-color: #3d3e50 !important;
  transform: translateY(-2px);
}

/* Google button */
.v-btn.google-btn {
  border: 2px solid #a3a3a3;
  background-color: rgba(255, 255, 255, 80%) !important;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.v-btn.google-btn:hover {
  background-color: rgba(61, 61, 61, 100%);
  transform: translateY(-2px);
}
</style>
