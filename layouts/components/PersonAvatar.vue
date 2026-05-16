<script setup lang="ts">
import profileImg from '@images/avatars/avatar-22.png'
import { onMounted, ref } from 'vue'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'

const keycloakStore = useKeycloakStore()
const config = useRuntimeConfig()
const apiBaseUrl1 = config.public.apiBaseUrl1 as string

const avatarUrl = ref(profileImg) // default fallback as initial value

async function checkImageExists(url: string) {
  return new Promise(resolve => {
    const img = new Image()

    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

onMounted(async () => {
  if (keycloakStore.kodeIdentitas) {
    const imageUrl = `${apiBaseUrl1}/public/photo/${keycloakStore.kodeIdentitas}.jpg`
    const exists = await checkImageExists(imageUrl)
    if (exists)
      avatarUrl.value = imageUrl
  }
})
</script>

<template>
  <VAvatar
    :image="avatarUrl"
    height="120"
    width="120"
  />
</template>
