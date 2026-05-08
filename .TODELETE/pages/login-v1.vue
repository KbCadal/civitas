<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import authV2LoginBgYellowDark from '@images/dstipro/auth-bg-yellow-dark.png'
import authV2LoginBgYellowLight from '@images/dstipro/auth-bg-yellow-light.png'
import authV2LoginLogoLight from '@images/dstipro/ui-logo-light.png'

import keycloakInstance from '@/keycloak'

function login() {
  keycloakInstance.login({
    redirectUri: `${window.location.origin}/profile`,
  })
}

onMounted(() => {
  if (keycloakInstance.authenticated)
    router.push('/profile')
})

const authThemeImg = useGenerateImageVariant(
  authV2LoginLogoLight,
  authV2LoginLogoLight,
)

const authThemeColor = useGenerateColorVariant(
  '#4f4f4f',
  'transparent',
)

const authThemeBg = useGenerateImageVariant(
  authV2LoginBgYellowLight,
  authV2LoginBgYellowDark,
)

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
    <section class="global-main-login-component-3">
      <div
        :style="{ backgroundColor: `${authThemeColor}` }"
        class="card-main-login-component-3"
      >
        <div class="logo-login-component-3">
          <VImg
            :src="authThemeImg"
            class="image-10-3 lazyload"
          />
        </div>
        <div class="form-login-component-3">
          <VCol
            cols="12"
            class="text-center"
          >
            <VBtn
              color="warning"
              @click="login"
            >
              <VIcon
                start
                icon="ri-login-box-line"
              /> Login SSO
            </VBtn>
          </VCol>
        </div>
      </div>
    </section>
  </body>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
