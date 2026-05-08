<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import UserEmail from '@/components/beranda/UserEmail.vue'
import UserJadwal from '@/components/beranda/UserJadwal.vue'
import UserLib from '@/components/beranda/UserLib.vue'
import UserLog from '@/components/beranda/UserLog.vue'
import UserRiwayat from '@/components/beranda/UserRiwayat.vue'
import UserRiwayatParkir from '@/components/beranda/UserRiwayatParkir.vue'

import UserProfile from '@/components/beranda/profile/index.vue'
import UserApplication from '@/components/beranda/UserApplication.vue'
import UserAuthorization from '@/components/beranda/UserAuthorization.vue'
import UserKeamanan from '@/components/beranda/UserKeamanan.vue'
import UserPeta from '@/components/beranda/UserPeta.vue'
import UserProfileHeader from '@/components/beranda/UserProfileHeader.vue'
import UserProfileHeaders from '@/components/beranda/UserProfileHeaders.vue'
import UserSnackbars from '@/components/beranda/UserSnackbars.vue'
import { useAuthFetch } from '@/composables/useAuthFetch'

// Refresh admin allowlist when authorization changes elsewhere in the UI

const keycloakStore = useKeycloakStore()

definePageMeta({
  navActiveLink: 'tab',
  key: 'tab',

})

const route = useRoute('tab')
const router = useRouter()

// Pastikan activeTab bertipe string agar tidak ada error TypeScript
// const activeTab = computed(() => String(route.params.tab))
const activeTab = computed({
  get: () => route.params.tab,
  set: () => route.params.tab,
})

// Semua tab
const tabs = [
  { title: 'Profil', icon: 'ri-user-line', tab: 'profile' },
  { title: 'Keamanan', icon: 'ri-lock-line', tab: 'keamanan' },
  { title: 'Surat Elektronik', icon: 'ri-mail-line', tab: 'email' },

  // { title: 'Berita', icon: 'ri-news-line', tab: 'berita' },
  { title: 'Riwayat', icon: 'ri-file-history-line', tab: 'riwayat' },
  { title: 'Jadwal', icon: 'ri-calendar-line', tab: 'jadwal' },
  { title: 'Log Absen', icon: 'ri-history-line', tab: 'log' },
  { title: 'Peta', icon: 'ri-history-line', tab: 'peta' },
  { title: 'Peminjaman Buku', icon: 'ri-book-line', tab: 'lib' },
  { title: 'Riwayat Parkir', icon: 'ri-car-line', tab: 'riwayat-parkir' },
]

// Filter tab berdasarkan civitas
const tabsByCivitas: Record<string, string[]> = {
  staf: ['profile', 'keamanan', 'email', 'log', 'riwayat-parkir', 'peta', 'lib'],
  dosen: ['profile', 'keamanan', 'email', 'jadwal', 'log', 'riwayat-parkir', 'peta', 'lib'],
  mahasiswa: ['profile', 'keamanan', 'email', 'jadwal', 'riwayat', 'riwayat-parkir', 'peta', 'lib'],
}

// Compute allowed tabs for the current user
const allowedTabs = computed(() => {
  const civitas = keycloakStore.civitas

  return tabsByCivitas[civitas] ?? []
})

// Determine admin access dynamically by querying the server allowlist.
// Run the request client-side only so we use the user's access token.
const { data: adminData, refresh: refreshAdminData } = useAuthFetch('/api/admin/authorization', { server: false })

const isAdmin = computed(() => {
  try {
    const uname = String(keycloakStore.preferred_username ?? keycloakStore.kodeIdentitas ?? '')
    const allowed: string[] = adminData.value?.allowed ?? []

    return allowed.includes(uname)
  }
  catch (e) {
    return false
  }
})

onMounted(() => {
  const handler = () => {
    try { refreshAdminData?.() }
    catch (e) {}
  }

  window.addEventListener('admin:authorization:changed', handler)

  // store handler on window so we can remove it later
  ;(window as any).__refreshAdminHandler = handler
})

onBeforeUnmount(() => {
  const h = (window as any).__refreshAdminHandler
  if (h)
    window.removeEventListener('admin:authorization:changed', h)
})

// Filter tabs based on the allowlist and add admin-only tabs when appropriate
const filteredTabs = computed(() => {
  // Start with tabs allowed by civitas
  const result = tabs.filter(tab => allowedTabs.value.includes(tab.tab))

  // If the user is admin (server allowlist), append admin tabs
  if (isAdmin.value) {
    const adminTabs = [
      { title: 'User Application', icon: 'ri-apps-line', tab: 'user-application' },
      { title: 'Profile Headers', icon: 'ri-image-line', tab: 'user-profile-headers' },
      { title: 'Snackbars', icon: 'ri-notification-line', tab: 'user-snackbars' },
      { title: 'User Authorization', icon: 'ri-shield-user-line', tab: 'user-authorization' },
    ]

    // Avoid duplicates
    for (const a of adminTabs) {
      if (!result.find(r => r.tab === a.tab))
        result.push(a)
    }
  }

  return result
})
</script>

<template>
  <UserProfileHeader class="mb-5" />
  <!--
    <div class="mb-10">
    <h1>Welcome, {{ keycloakStore.name }}</h1>
    </div>
  -->
  <div>
    <VTabs
      v-model="activeTab"
      class="v-tabs-pill"
    >
      <VTab
        v-for="item in filteredTabs"
        :key="item.icon"
        :value="item.tab"
        :to="{ name: 'tab', params: { tab: item.tab } }"
      >
        <VIcon
          start
          :icon="item.icon"
        />
        {{ item.title }}
      </VTab>
    </VTabs>

    <VWindow
      v-model="activeTab"
      class="mt-5 disable-tab-transition"
      :touch="false"
    >
      <!-- Profile -->
      <VWindowItem value="profile">
        <UserProfile />
      </VWindowItem>

      <!-- Keamanan -->
      <VWindowItem value="keamanan">
        <UserKeamanan />
      </VWindowItem>

      <!-- Berita -->
      <!--
        <VWindowItem value="berita">
        <UserBerita />
        </VWindowItem>
      -->
      <!-- <div> -->

      <!-- Riwayat -->
      <VWindowItem value="riwayat">
        <UserRiwayat />
      </VWindowItem>

      <!-- Jadwal -->
      <VWindowItem value="jadwal">
        <UserJadwal />
      </VWindowItem>

      <!-- Log Absen -->
      <VWindowItem value="log">
        <UserLog />
      </VWindowItem>

      <VWindowItem value="riwayat-parkir">
        <UserRiwayatParkir />
      </VWindowItem>

      <!-- Peta UI -->
      <VWindowItem value="peta">
        <UserPeta />
      </VWindowItem>

      <VWindowItem value="lib">
        <UserLib />
      </VWindowItem>

      <VWindowItem value="email">
        <UserEmail />
      </VWindowItem>

      <VWindowItem value="user-application">
        <UserApplication />
      </VWindowItem>

      <VWindowItem value="user-authorization">
        <UserAuthorization />
      </VWindowItem>

      <VWindowItem value="user-profile-headers">
        <UserProfileHeaders />
      </VWindowItem>
      <VWindowItem value="user-snackbars">
        <UserSnackbars />
      </VWindowItem>
    </VWindow>
  </div>
</template>
