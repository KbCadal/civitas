<script setup lang="ts">
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@core/utils/colorConverter'
import { useTheme } from 'vuetify'

const { global } = useTheme()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()
const { isMobile } = useDevice()
if (isMobile)
  configStore.appContentLayoutNav = 'vertical'

onMounted(() => {
  if (typeof window !== 'undefined' && window.location.hash) {
    const cleanUrl = window.location.origin + window.location.pathname

    window.history.replaceState(null, '', cleanUrl)
  }
})

useHead({
  title: 'Civitas - Universitas Indonesia',
  link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }],
})
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>

<style>
.v-theme--light {
  --v-theme-background: 245, 248, 255 !important;

  /* --v-theme-surface: 245, 248, 255 !important; */
}

.v-card {
  border-radius: 10px !important;
}
</style>
