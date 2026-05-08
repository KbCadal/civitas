<script setup lang="ts">
import { useKeycloakStore } from '@/@core/stores/keycloakStore'

import AuthProvider from '@/views/dstipro/beranda/authentication/AuthProvider.vue'
import authLoginBg from '/assets/images/dstipro/bg-blue-yellow.png'
import authLoginLogo from '/assets/images/dstipro/illust-login.png'

const authThemeImg = authLoginLogo

const authThemeBg = authLoginBg

const keycloakStore = useKeycloakStore()

definePageMeta({
  layout: 'blank',
  unauthenticatedOnly: true,

})
</script>

<template>
  <body
    :style="{ backgroundImage: `url(${authThemeBg})` }"
    class="body-2"
  >
    <section class="global-main-login-component">
      <div class="card-main-login-component4">
        <div class="logo-login-component4">
          <VImg
            :src="authThemeImg"
            max-width="650"
            max-height="300"
            class="image-10 lazyload"
          />
        </div>
        <div class="form-login-component">
          <VCol cols="12">
            <img
              src="/assets/images/beranda/logo-ui-hitam.png"
              width="100"
              height="auto"
              class="mb-0"
            >
          </VCol>

          <VCol cols="12">
            <AuthProvider />
          </VCol>
        </div>
      </div>
    </section>
  </body>
  <!-- </VRow> -->
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
