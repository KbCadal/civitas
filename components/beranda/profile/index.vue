<script setup lang="ts">
import About from './About.vue'
import DosenApp from './DosenApp.vue'
import StudentApp from './StudentApp.vue'
import TendikApp from './TendikApp.vue'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'

const keycloakStore = useKeycloakStore()

// Gunakan computed agar selalu reaktif
const isAuthenticated = computed(() => keycloakStore.authenticated)

console.log('Keycloak status:', isAuthenticated ? 'Authenticated' : 'Not Authenticated')
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <About />
    </VCol>

    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VRow>
        <VCol cols="12">
          <StudentApp v-if="keycloakStore.civitas == 'mahasiswa'" />
          <TendikApp v-if="keycloakStore.civitas == 'staf'" />
          <DosenApp v-if="keycloakStore.civitas == 'dosen'" />
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
