<script setup lang="ts">
import { VForm } from 'vuetify/components/VForm'
import AuthProvider from '@/views/dstipro/beranda/authentication/AuthProvider.vue'

import authV2MaskDark from '@images/dstipro/mask-v2-dark.png'
import authV2MaskLight from '@images/dstipro/mask-v2-light.png'

import authV2LoginBgDark from '@images/dstipro/auth-bg-dark.png'
import authV2LoginBgLight from '@images/dstipro/auth-bg-light.png'
import authV2LoginLogoDark from '@images/dstipro/ui-logo-dark.png'
import authV2LoginLogoLight from '@images/dstipro/ui-logo-light.png'

import { useKeycloakStore } from '@core/stores/keycloakStore'

const keycloakStore = useKeycloakStore()

const authThemeImg = useGenerateImageVariant(
  authV2LoginLogoDark,
  authV2LoginLogoLight,
)

const authThemeColor = useGenerateColorVariant(
  '#FFFFFF',
  '#303030',
)

const authThemeBg = useGenerateImageVariant(
  authV2LoginBgLight,
  authV2LoginBgDark,
)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

definePageMeta({
  layout: 'blank',
  unauthenticatedOnly: true,

})

const isPasswordVisible = ref(false)

const route = useRoute()
const router = useRouter()

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

const login = async () => {
  try {
    const res = await $api('/auth/login', {
      method: 'POST',
      body: {
        email: credentials.value.email,
        password: credentials.value.password,
      },
      onResponseError({ response }) {
        errors.value = response._data.errors
      },
    })

    const { accessToken, userData, userAbilityRules } = res

    useCookie('userAbilityRules').value = userAbilityRules
    ability.update(userAbilityRules)

    useCookie('userData').value = userData
    useCookie('accessToken').value = accessToken

    console.log('Ini userdata: ', userData)
    console.log('Ini accesstoken: ', accessToken)
    console.log('Ini route: ', route.query.to)

    // Redirect to `to` query if exist or redirect to index route
    // ❗ nextTick is required to wait for DOM updates and later redirect
    await nextTick(() => {
      router.replace(route.query.to ? String(route.query.to) : '/')
    })
  }
  catch (err) {
    console.error(err)
  }
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid)
      login()
  })
}
</script>

<template>
  <!-- <VRow no-gutters class="auth-wrapper d-flex align-center"> -->

  <body
    :style="{ backgroundImage: `url(${authThemeBg})` }"
    class="body-3"
  >
    <section
      id="w-node-_5719babe-35ba-7e2e-5380-184bb80f5575-c180ec33"
      class="login-form-main-component"
    >
      <div class="login-form-global-component">
        <div class="login-form-input-padding">
          <h2 class="heading-8">
            SSO
          </h2>
          <h2 class="text-h5 heading-7">
            Single Sign On
          </h2>

          <div class="form-block w-form">
            <VForm
              ref="refVForm"
              @submit.prevent="onSubmit"
            >
              <VRow>
                <!-- email -->
                <VCol cols="12">
                  <VTextField
                    v-model="credentials.email"
                    label="Email"
                    placeholder="johndoe@email.com"
                    type="email"
                    autofocus
                    :rules="[requiredValidator, emailValidator]"
                    :error-messages="errors.email"
                  />
                </VCol>

                <!-- password -->
                <VCol cols="12">
                  <VTextField
                    v-model="credentials.password"
                    label="Password"
                    placeholder="············"
                    :rules="[requiredValidator]"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    :error-messages="errors.password"
                    :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                    @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  />

                  <div class="d-flex align-center flex-wrap justify-space-between mb-5">
                    <VCheckbox
                      v-model="rememberMe"
                      label="Remember me"
                    />
                    <RouterLink
                      class="text-primary"
                      :to="{ name: 'forgot-password' }"
                    >
                      Forgot Password?
                    </RouterLink>
                  </div>

                  <VBtn
                    block
                    type="submit"
                  >
                    Login
                  </VBtn>
                </VCol>

                <VCol
                  cols="12"
                  class="d-flex align-center"
                >
                  <VDivider />
                  <span class="mx-4">or</span>
                  <VDivider />
                </VCol>

                <!-- auth providers -->
                <VCol
                  cols="12"
                  class="text-center"
                >
                  <AuthProvider />
                </VCol>
              </VRow>
            </VForm>
          </div>
        </div>
      </div>
    </section>

    <div
      id="w-node-_04453b3b-5016-2053-2ed2-5ef813d849f8-c180ec33"
      class="ui-logo-login-component"
    >
      <VImg
        :src="authThemeImg"
        class="ui-logo-login-2 lazyload"
      />
    </div>
  </body>
  <!-- </VRow> -->
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
