<script lang="ts" setup>

// import coverImg from '@images/pages/user-profile-header-bg.png'
import coverImgDark from '@images/beranda/header-bg-dark.png'
import coverImgLight from '@images/beranda/header-bg.png'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import duration from 'dayjs/plugin/duration'
import utc from 'dayjs/plugin/utc'
import { computed, onMounted, ref, watch } from 'vue'

import { useTheme } from 'vuetify'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import { useAuthFetch } from '@/composables/useAuthFetch'
import keycloakInstance from '@/keycloak'

dayjs.locale('id')

dayjs.extend(utc)

dayjs.extend(duration)

const activeHeader = ref<any | null>(null)

const { global } = useTheme()

const currentCoverImg = computed(() => {
  const light = activeHeader.value?.lightPath || coverImgLight
  const dark = activeHeader.value?.darkPath || coverImgDark

  if (global.name.value === 'dark')
    return dark

  return light
})

// const userImg = computed(() => profileHeaderData.profileImg || profileImg)

const keycloakStore = useKeycloakStore()

// Gunakan computed agar selalu reaktif
const isAuthenticated = computed(() => keycloakStore.authenticated)

// Compute initials from available name sources for avatar fallback
const initials = computed(() => {
  const nameSources = [
    keycloakStore.name,
    items.value?.name,
    items.value?.NAMA,
    keycloakStore.preferred_username,
  ]

  const name = String(nameSources.find(n => !!n) || '').trim()
  if (!name)
    return ''

  const parts = name.split(/\s+/)
  if (parts.length === 1)
    return parts[0].charAt(0).toUpperCase()

  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
})

// We intentionally always show initials (no profile image).
// Keep the initials computation above and always render them.

const config = useRuntimeConfig()
const ssoBaseUrl = config.public.ssoBaseUrl as string

const logoutUrl = ref(`${ssoBaseUrl}/realms/main/protocol/openid-connect/logout?client_id=civitas`)

const logoutUser = () => {
  // Use window.location.origin for a dynamic base URL
  const redirectUri = window.location.origin

  // Redirect to logout URL with the dynamic origin
  window.location.href = `${logoutUrl.value}&post_logout_redirect_uri=${redirectUri}/login`
}

const items = ref<Record<string, any>>({})
const loading = ref(false)
const errordata = ref('')
const isBirthday = ref(false)
const parkirItems = ref<any>(null)
const { api } = useCivitasApi()

// fetch allowed admin (client-side)
const { data: adminData } = useAuthFetch('/api/admin/authorization', { server: false })

const isAdmin = computed(() => {
  try {
    const kode = String(keycloakStore.preferred_username ?? '')
    const allowed: string[] = adminData.value?.allowed ?? []

    return allowed.includes(kode)
  }
  catch (e) {
    return false
  }
})

async function getProfileData() {
  try {
    const { response: profileResponse, error: profileError } = await api.user.getProfile()

    // Unwrap the profile data
    const profileData = unwrapResponseJson(profileResponse)

    if (profileData)
      items.value = profileData
    else
      throw new Error('Data profil tidak ditemukan')
  }
  catch (err: any) {
    errordata.value = err?.message || 'Terjadi kesalahan saat mengambil data profil'
    console.error('Gagal mengambil data profil:', errordata.value)
  }
}

// Fetch parking data separately
async function getParkirData() {
  try {
    const { response: parkirResponse } = await api.user.getParkirAktif()
    const parkirData = unwrapResponseJson(parkirResponse)

    // parkirData.data is now an object, not array
    if (parkirData?.data && parkirData.data.is_active)
      parkirItems.value = parkirData.data
    else
      parkirItems.value = null
  }
  catch (err: any) {
    errordata.value = err?.message || 'Terjadi kesalahan saat mengambil data parkir'
    console.error('Gagal mengambil data parkir:', errordata.value)
  }
}

async function fetchActiveHeader() {
  try {
    const civitasRaw = String(keycloakStore.civitas || '').toLowerCase()
    let role = 'mahasiswa'

    if (civitasRaw.includes('dosen'))
      role = 'dosen'
    else if (civitasRaw.includes('staf') || civitasRaw.includes('staff'))
      role = 'staf'
    else if (civitasRaw.includes('mahasiswa'))
      role = 'mahasiswa'

    const result = await $fetch(`/api/profile-headers/active?role=${encodeURIComponent(role)}`)

    activeHeader.value = result?.profileHeader || null
  }
  catch (e) {
    activeHeader.value = null
  }
}

function unwrapResponseJson(refObj: any) {
  // Check if the object is null or undefined
  if (refObj == null)
    return null

  // Check if the object is a Vue ref and unwrap its value if it is
  const isRef = (val: any) => val && typeof val === 'object' && val.__v_isRef

  let data = refObj

  // Unwrap the ref if it's a Vue ref and ensure we keep unwrapping nested refs
  while (isRef(data))
    data = data.value

  // Check if the unwrapped data is still a Vue ref
  if (isRef(data))
    data = data.value

  // Try parsing if the result is a string JSON
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    }
    catch {
      throw new Error('Format string JSON tidak valid')
    }
  }

  // If it's an object, we return it after removing any potential circular references
  if (typeof data === 'object') {
    // If data is an empty object or array, return null
    if (Object.keys(data).length === 0)
      return null

    return JSON.parse(JSON.stringify(data)) // Avoid Vue reactivity here if needed
  }

  // If data is not valid or recognized, throw an error
  throw new Error('Data tidak ditemukan atau format tidak dikenali')
}

// --- Progress bar logic (from PaketAktif.vue) ---
function getRemainingSeconds(expiryDate: Date | string | undefined): number {
  if (!expiryDate)
    return 0
  try {
    const now = new Date()
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate

    return Math.max(Math.floor((expiry.getTime() - now.getTime()) / 1000), 0)
  }
  catch {
    return 0
  }
}
function getTotalSeconds(startDate: Date | string | undefined, expiryDate: Date | string | undefined): number {
  if (!startDate || !expiryDate)
    return 0
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate

    return Math.max(Math.floor((expiry.getTime() - start.getTime()) / 1000), 0)
  }
  catch {
    return 0
  }
}
function getRemainingPercentage(startDate: Date | string | undefined, expiryDate: Date | string | undefined): number {
  const total = getTotalSeconds(startDate, expiryDate)
  const remaining = getRemainingSeconds(expiryDate)

  return total > 0 ? (remaining / total) * 100 : 0
}
function getProgressBarColor(percent: number) {
  if (percent > 50)
    return 'green'
  if (percent > 20)
    return 'orange'

  return 'red'
}

// --- Parking computed properties ---
const parkirStartDate = computed(() => parkirItems.value?.created_at)
const parkirEndDate = computed(() => parkirItems.value?.transaction?.expired_at)
const parkirVehicles = computed(() => parkirItems.value?.vehicles || [])

const daysLeft = computed(() => {
  if (!parkirEndDate.value)
    return 0
  const endDate = new Date(parkirEndDate.value)
  const now = new Date()

  return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
})

const parkirStatus = computed(() => {
  if (!parkirItems.value || parkirItems.value.status !== 'ACTIVE' || daysLeft.value <= 0)
    return 'Parkir Non Aktif'

  return parkirCountdown.value
})

const progress = computed(() => {
  if (!parkirStartDate.value || !parkirEndDate.value)
    return 0

  return getRemainingPercentage(parkirStartDate.value, parkirEndDate.value)
})

const progressColor = computed(() => getProgressBarColor(progress.value))

// Format date to readable Indonesian format: "30 November 2025"
function formatDate(date: string | undefined) {
  if (!date)
    return '-'

  return dayjs(date).format('D MMMM YYYY')
}

// Countdown text for parkir aktif (bulan, hari)
function formatCountdown(seconds: number): string {
  if (seconds <= 0)
    return 'Expired'
  const months = Math.floor(seconds / (30 * 24 * 3600))
  const days = Math.floor((seconds % (30 * 24 * 3600)) / (24 * 3600))
  if (months > 0)
    return `${months} bulan${days > 0 ? `, ${days} hari` : ''}`
  if (days > 0)
    return `${days} hari`

  return 'Kurang dari 1 hari'
}

const parkirCountdown = computed(() => {
  if (!parkirEndDate.value)
    return ''
  const seconds = getRemainingSeconds(parkirEndDate.value)

  return formatCountdown(seconds)
})

// Fetch data from API
onMounted(() => {
  getProfileData()
  getParkirData()

  // Load server-assigned header for current civitas
  fetchActiveHeader()

  checkBirthday()
})

// Menentukan nilai tanggal lahir berdasarkan kondisi `civitas`
const tglLahir = computed(() => {
  return keycloakStore.civitas === 'mahasiswa' ? items.value?.TGL_LAHIR : items.value?.tgl_lahir
})

// Cek apakah hari ini adalah ulang tahun
function checkBirthday() {
  if (!tglLahir.value) {
    isBirthday.value = false

    return
  }

  // const birthDate = dayjs(tglLahir.value)
  const birthDate = dayjs(tglLahir.value)
  const today = dayjs()

  isBirthday.value = birthDate.format('MM-DD') === today.format('MM-DD')
}

watch(tglLahir, checkBirthday)

const umur = computed(() => {
  if (!tglLahir.value)
    return 'Data tidak tersedia'

  const birthDate = dayjs(tglLahir.value) // or dayjs(tglLahir.value)
  if (!birthDate.isValid())
    return 'Format tanggal tidak valid'

  const today = dayjs()

  const years = today.diff(birthDate, 'year')
  const afterYears = birthDate.add(years, 'year')

  const months = today.diff(afterYears, 'month')
  const afterMonths = afterYears.add(months, 'month')

  const days = today.diff(afterMonths, 'day')

  return `${years} tahun, ${months} bulan, ${days} hari`
})

// Fungsi untuk menghitung waktu menuju ulang tahun berikutnya
const ulangTahunBerikutnya = computed(() => {
  if (!tglLahir.value)
    return 'Data tidak tersedia'

  const birthDate = dayjs(tglLahir.value)

  if (!birthDate.isValid())
    return 'Format tanggal tidak valid'

  const today = dayjs().startOf('day') // Start of today
  let nextBirthday = birthDate.year(today.year())

  // Jika ulang tahun tahun ini sudah lewat, pakai tahun depan
  if (nextBirthday.isBefore(today) || nextBirthday.isSame(today, 'day') === false && nextBirthday.diff(today, 'day') < 1)
    nextBirthday = nextBirthday.add(1, 'year')

  // Hitung selisih kalender
  const months = nextBirthday.diff(today, 'month')
  const days = nextBirthday.diff(today.add(months, 'month'), 'day')

  return `${months} bulan, ${days} hari`
})

const goToParking = () => {
  window.open('https://parkir.ui.ac.id/apps/site/index', '_blank')
}

const dialog = ref(false)

function openDialog() {
  dialog.value = true
}

function handleParkirClick() {
  if (daysLeft.value > 0)
    openDialog()
  else
    goToParking()
}

const passwordDaysLeft = computed(() => {
  const shadowExpire = keycloakInstance.tokenParsed.shadowExpire

  if (!shadowExpire)
    return null

  const expExcelSerial = Number(shadowExpire)
  if (isNaN(expExcelSerial))
    return null

  const expireDate = dayjs('1970-01-01').add(expExcelSerial, 'days')
  const now = dayjs()

  return expireDate.diff(now, 'day')
})

const passwordDaysLeftMonth = computed(() => {
  const shadowExpire = keycloakInstance.tokenParsed.shadowExpire

  if (!shadowExpire)
    return null

  const expExcelSerial = Number(shadowExpire)
  if (isNaN(expExcelSerial))
    return null

  const expireDate = dayjs('1970-01-01').add(expExcelSerial, 'days')

  const now = dayjs()

  const totalDaysLeft = expireDate.diff(now, 'day')

  let futureDate = now.add(totalDaysLeft, 'day')

  let months = futureDate.diff(now, 'month')
  let remainingDays = futureDate.diff(now.add(months, 'month'), 'day')

  // If totalDaysLeft is negative, invert direction of calculation
  if (totalDaysLeft < 0) {
    futureDate = now.subtract(Math.abs(totalDaysLeft), 'day')
    months = futureDate.diff(now, 'month')
    remainingDays = futureDate.diff(now.add(months, 'month'), 'day')
  }

  return `${months} bulan, ${remainingDays} hari`
})

// Active snackbars fetched from server (may be multiple)
const activeSnackbars = ref<Array<any>>([])
const showStates = ref<Array<boolean>>([])

async function fetchActiveSnackbars() {
  try {
    const civitasRaw = String(keycloakStore.civitas || '').toLowerCase()
    let role = 'mahasiswa'

    if (civitasRaw.includes('dosen'))
      role = 'dosen'
    else if (civitasRaw.includes('staf') || civitasRaw.includes('staff'))
      role = 'staf'
    else if (civitasRaw.includes('mahasiswa'))
      role = 'mahasiswa'

    const birth = (tglLahir.value && String(tglLahir.value).trim()) ? dayjs(tglLahir.value).format('YYYY-MM-DD') : ''

    const res: any = await $fetch(`/api/snackbars/active?role=${encodeURIComponent(role)}&birthdate=${encodeURIComponent(birth)}`)

    if (res && Array.isArray(res.snackbars)) {
      activeSnackbars.value = res.snackbars.map((s: any) => ({ ...s, show: true }))
      showStates.value = activeSnackbars.value.map(() => true)
    }
    else {
      activeSnackbars.value = []
      showStates.value = []
    }
  }
  catch (e) {
    activeSnackbars.value = []
  }
}

// fetch on mount and when birthday changes
onMounted(() => {
  fetchActiveSnackbars()
})

watch([isBirthday, () => keycloakStore.civitas, tglLahir], () => {
  // refetch when birthday or civitas changes
  fetchActiveSnackbars()
})

// Keep activeSnackbars[].show in sync with showStates
watch(showStates, vals => {
  for (let i = 0; i < vals.length; i++) {
    if (activeSnackbars.value[i])
      activeSnackbars.value[i].show = !!vals[i]
  }
}, { deep: true })
</script>

<template>
  <VCard v-if="currentCoverImg">
    <!-- Server-provided snackbars (may be multiple). Each snackbar object has { id, title, iconPrepend, body, show } -->
    <VSnackbar
      v-for="(s, idx) in activeSnackbars"
      :key="s.id ?? idx"
      v-model="showStates[idx]"
      location="top"
      timeout="60000"
      :color="s.color || 'primary'"
      class="happy-birthday"
      elevation="8"
    >
      <template #prepend>
        <span style="font-size: 2rem; margin-inline-end: 12px;">{{ s.iconPrepend || '!' }}</span>
      </template>
      <span>
        <span style="font-size: 2rem; margin-inline-end: 12px;">{{ s.iconPrepend || '!' }}</span>
        <strong>{{ s.title }}</strong>
        <br>
        <span style="font-size: 1rem; font-weight: 400;">{{ s.body }}</span>
      </span>
      <template #actions>
        <VBtn
          icon
          variant="text"
          @click="showStates[idx] = false"
        >
          <VIcon
            icon="ri-close-line"
            :style="{ color: 'rgb(var(--v-theme-on-primary))' }"
          />
        </VBtn>
      </template>
    </VSnackbar>

    <VImg
      :src="currentCoverImg"
      min-height="125"
      max-height="250"
      cover
    />

    <VCardText
      v-if="isAuthenticated"
      class="d-flex align-bottom flex-sm-row flex-column justify-center gap-x-6"
    >
      <div class="d-flex h-0">
        <!-- Always render initials inside avatar (no profile image) -->
        <VAvatar
          rounded="circle"
          size="130"
          class="user-profile-avatar mx-auto avatar-gradient"
        >
          <span class="avatar-initials">{{ initials }}</span>
        </VAvatar>
      </div>

      <div class="user-profile-info w-100 mt-16 pt-6 pt-sm-0 mt-sm-0">
        <h4 class="text-h4 text-center text-sm-start mb-2">
          {{ keycloakStore.name }}
        </h4>

        <div class="d-flex align-center justify-center justify-sm-space-between flex-wrap gap-4">
          <div class="d-flex flex-wrap justify-center justify-sm-start flex-grow-1 gap-6">
            <div class="d-flex align-center gap-x-2">
              <VIcon
                size="24"
                icon="ri-id-card-line"
              />

              <VTooltip
                activator="parent"
                location="top"
              >
                Status kamu adalah {{ keycloakStore.civitas
                  .toLowerCase()
                  .split(' ')
                  .map(word => word.slice(0))
                  .join(' ') }}
              </VTooltip>
              <div class="text-body-1 font-weight-medium">
                <!-- {{ keycloakStore.civitas[0].toUpperCase() + keycloakStore.civitas.slice(1) }} -->
                {{ keycloakStore.civitas
                  .toLowerCase()
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ') == 'dosen' ? 'STAF' : keycloakStore.civitas
                    .toLowerCase()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ') }}
              </div>
            </div>
            <!-- Admin indicator: only show if user is in admin allowlist -->
            <div
              v-if="isAdmin"
              class="d-flex align-center gap-x-2"
            >
              <VIcon
                size="24"
                icon="ri-shield-user-line"
              />
              <VTooltip
                activator="parent"
                location="top"
              >
                Kamu adalah admin
              </VTooltip>
              <div class="text-body-1 font-weight-medium">
                Admin
              </div>
            </div>

            <div class="d-flex align-center gap-x-2">
              <VIcon
                size="24"
                icon="ri-car-line"
              />
              <VBtn
                variant="tonal"
                :color="daysLeft > 0 ? 'primary' : 'error'"
                @click="handleParkirClick"
              >
                {{ parkirStatus }}
                <VTooltip
                  v-if="daysLeft > 0"
                  activator="parent"
                  location="top"
                >
                  <div
                    class="d-flex flex-column p-2"
                    style="padding-block: 16px 16px;"
                  >
                    <div class="d-flex align-center gap-x-2">
                      <VIcon
                        size="20"
                        icon="ri-calendar-line"
                      />
                      <span>Mulai: {{ formatDate(parkirStartDate) }}</span>
                    </div>
                    <div class="d-flex align-center gap-x-2">
                      <VIcon
                        size="20"
                        icon="ri-calendar-check-line"
                      />
                      <span>Berakhir: {{ formatDate(parkirEndDate) }}</span>
                    </div>
                    <div class="d-flex align-center gap-x-2">
                      <VIcon
                        size="20"
                        icon="ri-time-line"
                      />
                      <span>{{ daysLeft }} hari tersisa</span>
                    </div>
                    <div
                      v-if="parkirVehicles.length"
                      style="margin-block-start: 12px;"
                    >
                      <div
                        class="mb-2 d-flex align-center gap-x-2"
                        style="font-weight: 600;"
                      >
                        <VIcon
                          size="20"
                          icon="ri-car-line"
                        />
                        Kendaraan:
                      </div>
                      <div
                        class="d-flex flex-column ml-4"
                        style="gap: 8px;"
                      >
                        <span
                          v-for="v in parkirVehicles"
                          :key="v.id"
                          class="d-flex align-center"
                          style="gap: 8px;"
                        >
                          <VIcon
                            :icon="v.vehicle_type === 'CAR' ? 'ri-car-line' : 'ri-motorbike-line'"
                            size="18"
                          />
                          <span>{{ v.license_plate }}</span>
                        </span>
                      </div>
                    </div>
                    <VProgressLinear
                      :model-value="progress"
                      :color="progressColor"
                      height="12"
                      rounded
                      striped
                      class="mt-2"
                    >
                      <span
                        class="progress-text"
                        style="color: rgb(var(--v-theme-on-skin-default-surface)); font-weight: bold;"
                      >
                        {{ daysLeft > 0 ? parkirStatus : 'Expired' }}
                      </span>
                    </VProgressLinear>
                  </div>
                </VTooltip>
              </VBtn>

              <!-- Dialog popup -->
              <VDialog
                v-model="dialog"
                width="400"
              >
                <template #default>
                  <VCard>
                    <VCardTitle>
                      Informasi Parkir
                    </VCardTitle>
                    <VCardText>
                      <div class="d-flex align-center gap-x-2 mb-2">
                        <VIcon
                          size="20"
                          icon="ri-calendar-line"
                        />
                        <span>Mulai: {{ formatDate(parkirStartDate) }}</span>
                      </div>
                      <div class="d-flex align-center gap-x-2 mb-2">
                        <VIcon
                          size="20"
                          icon="ri-calendar-check-line"
                        />
                        <span>Berakhir: {{ formatDate(parkirEndDate) }}</span>
                      </div>
                      <div class="d-flex align-center gap-x-2 mb-4">
                        <VIcon
                          size="20"
                          icon="ri-time-line"
                        />
                        <span>{{ daysLeft }} hari tersisa</span>
                      </div>
                      <div
                        v-if="parkirVehicles.length"
                        style="margin-block-start: 12px;"
                      >
                        <div
                          class="mb-2 d-flex gap-x-2 align-center"
                          style="font-weight: 600;"
                        >
                          <VIcon
                            size="20"
                            icon="ri-car-line"
                          />
                          Kendaraan:
                        </div>
                        <div
                          class="d-flex flex-column ml-4"
                          style="gap: 8px;"
                        >
                          <span
                            v-for="v in parkirVehicles"
                            :key="v.id"
                            class="d-flex align-center gap-x-2"
                            style="gap: 8px;"
                          >
                            <VIcon
                              :icon="v.vehicle_type === 'CAR' ? 'ri-car-line' : 'ri-motorbike-line'"
                              size="18"
                            />
                            <span>{{ v.license_plate }}</span>
                          </span>
                        </div>
                      </div>
                      <VProgressLinear
                        :model-value="progress"
                        :color="progressColor"
                        height="12"
                        rounded
                        striped
                        class="mt-2"
                      >
                        <span
                          class="progress-text"
                          style="color: rgb(var(--v-theme-on-skin-default-surface)) !important; font-weight: bold;"
                        >
                          {{ daysLeft > 0 ? parkirStatus : 'Expired' }}
                        </span>
                      </VProgressLinear>
                    </VCardText>
                    <VCardActions>
                      <VSpacer />
                      <VBtn
                        color="primary"
                        @click="goToParking"
                      >
                        Lihat Detail
                      </VBtn>
                      <VBtn
                        text
                        @click="dialog = false"
                      >
                        Tutup
                      </VBtn>
                    </VCardActions>
                  </VCard>
                </template>
              </VDialog>
            </div>
            <div
              v-if="!isBirthday"
              class="d-flex align-center gap-x-2"
            >
              <VIcon
                size="24"
                icon="ri-cake-2-line"
              />
              <VTooltip
                activator="parent"
                location="top"
              >
                Ulang tahun berikutnya dalam {{ ulangTahunBerikutnya }}
              </VTooltip>
              <div class="text-body-1 font-weight-medium">
                <!-- {{ keycloakStore.civitas == 'mahasiswa' ? items?.TGL_LAHIR : items?.tgl_lahir }} -->
                {{ ulangTahunBerikutnya }}
              </div>
            </div>

            <div
              v-if="isBirthday"
              class="d-flex align-center gap-x-2"
            >
              <VIcon
                size="24"
                icon="ri-gift-line"
              />
              <div class="text-body-1 font-weight-medium">
                {{ umur }}
              </div>
            </div>

            <div
              v-if="passwordDaysLeft !== null"
              class="d-flex align-center gap-x-2"
            >
              <VIcon
                size="24"
                :color="passwordDaysLeft < 0 ? 'error' : (passwordDaysLeft <= 7 ? 'warning' : undefined)"
                icon="ri-key-line"
              />

              <VTooltip
                activator="parent"
                location="top"
              >
                Masa password berakhir {{ passwordDaysLeftMonth }} lagi
              </VTooltip>

              <div class="text-body-1 font-weight-medium">
                {{ passwordDaysLeftMonth }}
              </div>
            </div>
          </div>

          <VBtn
            class="bg-error"
            prepend-icon="ri-logout-box-r-line"
            @click="logoutUser"
          >
            Keluar
          </VBtn>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style lang="scss">
.user-profile-avatar {
  border: 5px solid rgb(var(--v-theme-surface));

  /* Use a primary gradient background for the avatar */
  background-image: linear-gradient(150deg, rgb(var(--v-theme-primary)) 60%, rgb(240, 240, 240) 100%);
  color: rgb(var(--v-theme-on-primary));
  inset-block-start: -3rem;

  .v-img__img {
    border-radius: 0.375rem;
  }
}

/* Animasi Happy Birthday */
.happy-birthday {
  animation: bounce 1.5s infinite alternate ease-in-out;
  inset-block-start: 25px !important;
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-10px);
  }
}

@media (max-width: 700px) {
  .happy-birthday .v-overlay__content {
    border-radius: 12px;
    font-size: 1rem !important;
    max-inline-size: 96vw;
    min-inline-size: 0;
    padding-block: 12px !important;
    padding-inline: 0;
    padding-inline: 10px !important;
  }
}

/* Avatar initials styling */
.avatar-initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  block-size: 100%;
  color: rgb(var(--v-theme-on-primary));
  font-size: 44px;
  font-weight: 700;
  inline-size: 100%;
}
</style>
