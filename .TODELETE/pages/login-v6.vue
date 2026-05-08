<script setup lang="ts">
import type { VForm } from 'vuetify/components/VForm'

import authV2MaskDark from '@images/pages/mask-v2-dark.png'
import authV2MaskLight from '@images/pages/mask-v2-light.png'

import { useKeycloakStore } from '@/@core/stores/keycloakStore'

import AuthProvider from '@/views/dstipro/beranda/authentication/AuthProvider.vue'
import authLoginLogo from '/assets/images/beranda/illust-login.png'
import authLoginBg from '/assets/images/beranda/rektorat-bg.png'

const authThemeImg = authLoginLogo

const authThemeBg = authLoginBg

const keycloakStore = useKeycloakStore()
const data = ref<Record<string, any> | null>(null)
const error = ref<Record<string, any> | null>(null)

const { signIn, data: sessionData } = useAuth()

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

definePageMeta({
  layout: 'blank',
  unauthenticatedOnly: true,

})

const isPasswordVisible = ref(false)

const route = useRoute()

const ability = useAbility()

const errors = ref<Record<string, string | undefined>>({
  email: undefined,
  password: undefined,
})

const refVForm = ref<VForm>()

const credentials = ref({
  email: 'admin@demo.com',
  password: 'admin',
})

const rememberMe = ref(false)
</script>

<template>
  <div class="container">
    <div class="left" />
    <div class="right">
      <img
        src="/assets/images/beranda/logo-ui-hitam.png"
        alt="Logo UI"
        class="logo"
      >
      <VCol
        cols="5"
        class="text-center"
      >
        <AuthProvider />
      </VCol>
    </div>
  </div>
</template>

<style scoped>
.login-button {
  border: none;
  border-radius: 8px;
  background-color: #ffd700;
  color: white;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  margin-block-start: 20px;
  padding-block: 12px;
  padding-inline: 24px;
  transition: background-color 0.2s;
}

.container {
  display: flex;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  block-size: 100vh;
  font-family: Arial, sans-serif;
}

/* Left Side */
.left {
  flex: 1;
  background: url("/assets/images/beranda/rbg.png") no-repeat center center;
  background-size: cover;
}

/* Right Side */
.right {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fdf8e7;
  gap: 20px; /* Menambah jarak antar elemen */
  padding-block-start: 240px;
}

/* Logo */
.logo {
  inline-size: 120px;
  margin-block-end: 20px;
}

/* Title */
h1 {
  color: #000;
  font-size: 24px;
  text-align: center;
}

.login-button:hover {
  background-color: #e6c200;
}

@media (max-width: 768px) {
  .container {
    align-items: center;
    justify-content: center;
    background: url("/assets/images/beranda/rektorat-ipad-bg.png") no-repeat center center;
    background-size: cover;
  }

  .left {
    display: none;
  }

  .right {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    border-radius: 20px;
    background-color: rgba(253, 248, 231, 90%);
    block-size: auto;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 10%);
    inline-size: 90%;
    max-inline-size: 350px;
  }
}

@media (max-width: 480px) {
  .container {
    background: url("/assets/images/beranda/rektorat-iphone-bg.png") no-repeat center center;
    background-size: cover;
  }

  .right {
    padding: 30px;
    inline-size: 90%;
    max-inline-size: 320px;
  }

  .logo {
    inline-size: 90px;
  }
}
</style>
