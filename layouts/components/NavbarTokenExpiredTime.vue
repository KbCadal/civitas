<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import keycloakInstance from '@/keycloak'

const keycloakStore = useKeycloakStore()
const authenticated = computed(() => keycloakStore.authenticated)

const now = ref(Math.floor(Date.now() / 1000))

let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    now.value = Math.floor(Date.now() / 1000)
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

const computedExpIn = computed(() => {
  return authenticated.value && keycloakInstance.refreshTokenParsed?.exp
    ? keycloakInstance.refreshTokenParsed.exp - now.value
    : null
})

const formattedExpIn = computed(() => {
  if (computedExpIn.value === null)
    return '--:--'

  if (computedExpIn.value < 0)
    return 'Expired'

  const minutes = Math.floor(computedExpIn.value / 60)
  const seconds = computedExpIn.value % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})
</script>

<template>
  <div
    v-if="authenticated"
    class="me-4"
    style="position: relative; block-size: 55px; inline-size: 55px;"
  >
    <div
      class="font-weight-bold"
      style="position: absolute; inset-block-start: 50%; inset-inline-start: 50%; transform: translate(-50%, -50%);"
    >
      {{ formattedExpIn }}
    </div>
  </div>
</template>
