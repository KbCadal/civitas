<script lang="ts" setup>
import logo from '@images/beranda/logo-ui-civitas.svg?raw'
import { HorizontalNavLayout } from '@layouts'
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import NavbarTokenExpiredTime from '@/layouts/components/NavbarTokenExpiredTime.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'

// import navItems from '@/navigation/horizontal'

// Keycloak & state
</script>

<template>
  <!-- <HorizontalNavLayout :nav-items="navItems"></HorizontalNavLayout> -->
  <HorizontalNavLayout>
    <!-- 👉 navbar -->
    <template #navbar>
      <NuxtLink
        to="/"
        class="d-flex align-start gap-x-4"
      >
        <!-- <VNodeRenderer :nodes="themeConfig.app.logo" /> -->
        <div style=" display: inline-flex; align-items: center; gap: 8px;">
          <div
            style=" display: inline-block; block-size: 35px; color: rgb(var(--v-theme-on-primary));line-height: 0;"
            v-html="logo"
          />
        </div>
      </NuxtLink>
      <VSpacer />

      <!-- <NavSearchBar /> -->

      <!--
        <NavBarI18n
        v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
        :languages="themeConfig.app.i18n.langConfig"
        />
      -->
      <NavbarTokenExpiredTime style="color: rgb(var(--v-theme-on-primary)) !important;" />
      <NavbarThemeSwitcher style="color: rgb(var(--v-theme-on-primary)) !important;" />
      <!-- <NavbarShortcuts /> -->
      <!-- <NavBarNotifications class="me-2" /> -->

      <UserProfile />
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <TheCustomizer />
  </HorizontalNavLayout>
</template>
