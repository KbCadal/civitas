<script setup lang="ts">
import ImgDark from '@images/beranda/auth-bg-dark.png'
import ImgLight from '@images/beranda/auth-bg-light.png'

import authV2LoginBgDark from '@images/beranda/header-bg-dark.png'
import authV2LoginBgLight from '@images/beranda/header-bg.png'
import authV2LoginLogoDark from '@images/beranda/ui-logo-dark.png'
import authV2LoginLogoLight from '@images/beranda/ui-logo-light.png'
import AuthProvider from '@/components/beranda/AuthProvider.vue'

const authThemeImg = useGenerateImageVariant(
  authV2LoginLogoLight,
  authV2LoginLogoLight,
)

const authThemeImgMobile = useGenerateImageVariant(
  authV2LoginLogoDark,
  authV2LoginLogoLight,
)

const authThemeColor = useGenerateColorVariant('#FFFFFF', '#303030')

const authThemeBgElement = useGenerateImageVariant(ImgLight, ImgDark)

const authThemeBg = useGenerateImageVariant(
  authV2LoginBgLight,
  authV2LoginBgDark,
)

definePageMeta({
  layout: 'blank',
  unauthenticatedOnly: true,
})
</script>

<template>
  <VRow
    no-gutters
    class="auth-wrapper d-flex align-center"
  >
    <!-- Desktop Layout -->
    <body
      :style="{ backgroundImage: `url(${authThemeBg})` }"
      class="body-4 d-none d-md-flex"
    >
      <div class="main-component-margin">
        <!-- Desktop Card -->
        <section class="main-component-login login-desktop-card">
          <div
            :style="{
              backgroundImage: `url(${authThemeBgElement})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundBlendMode: 'normal, normal',
              width: '100%',
              opacity: 1,
            }"
          class="form-component-login"
        >
          <div class="combine-contact4_content">
            <h2 class="heading-8">
              SSO
            </h2>
            <h2 class="text-h5 heading-7">
              Single Sign On
            </h2>
            <AuthProvider />
          </div>
            <div class="login-copyright">
              &copy; Universitas Indonesia {{ new Date().getFullYear() }}
            </div>
          </div>
          <div
            class="logo-component-login"
            :style="{
              backgroundImage: `url(${ImgDark})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '100%',
            }"
          >
            <div class="logo-image-component-login">
              <VImg
                :src="authThemeImg"
                max-height="100"
                class="image-11 lazyload"
              />
            </div>
          </div>
        </section>
      </div>
    </body>
    <!-- Mobile Layout -->
    <div
      class="mobile-login-wrapper d-flex d-md-none"
      :style="{ backgroundImage: `url(${authThemeBg})` }"
    >
      <div class="login-mobile-logo">
        <VImg
          :src="authThemeImgMobile"
          max-height="50"
          class="image-12 lazyload"
        />
      </div>
      <div class="login-mobile-form">
        <div
          :style="{
            backgroundImage: `url(${authThemeBgElement})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundBlendMode: 'normal, normal',
            width: '100%',
            opacity: 1,
          }"
          class="form-component-login-2"
        >
          <div class="combine-contact4_content">
            <h2 class="heading-8">
              SSO
            </h2>
            <h2 class="text-h5 heading-7">
              Single Sign On
            </h2>
            <AuthProvider />
          </div>
          <div class="login-copyright text-center">
            &copy; Universitas Indonesia {{ new Date().getFullYear() }}
          </div>
        </div>
      </div>
    </div>
  </VRow>
</template>

<style lang="scss">
// filepath: c:\Users\samue\Tugas\beranda\civitas.ui\pages\login.vue
@use "@core/scss/template/pages/page-auth";

.image-12 {
  max-inline-size: 50px;
  padding-block: 100px;
  padding-inline: 40px;
}

.form-component-login-2 {
  position: relative;
  z-index: 1;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 1.7rem;
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 12px 16px #0003;
  inline-size: 100%;
  margin-inline: 0.5rem;
  max-inline-size: 380px;
  outline: 0.5px solid #747474;
  outline-offset: 0;
  padding-block: 5%;
  padding-inline: 0%;
}

.mobile-login-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  inline-size: 100vw;
  min-block-size: 100vh;
}

.login-mobile-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 100%;
}

.login-mobile-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  inline-size: 100%;
  max-inline-size: 380px;
  padding-block: 0;
  padding-inline: 8px;
}
</style>
