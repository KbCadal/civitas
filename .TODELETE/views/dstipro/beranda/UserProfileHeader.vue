<script lang="ts" setup>
import type { ProfileHeader } from '@db/dstipro/profile/types'
import profileImg from '@images/avatars/avatar-1.png'

// import coverImg from '@images/pages/user-profile-header-bg.png'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import PersonAvatar from '@/layouts/components/PersonAvatar.vue'
import coverImgDark from '@images/beranda/header-bg-dark.png'
import coverImgLight from '@images/beranda/header-bg.png'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

const profileHeaderData = ref<ProfileHeader | null>(null)

const coverImg = useGenerateImageVariant(coverImgLight, coverImgDark)

// const userImg = computed(() => profileHeaderData.profileImg || profileImg)

const keycloakStore = useKeycloakStore()

// Gunakan computed agar selalu reaktif
const isAuthenticated = computed(() => keycloakStore.authenticated)

const logoutUrl = ref(
  'https://login.ui.ac.id/realms/main/protocol/openid-connect/logout?client_id=civitas',
)

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
const parkirItems = ref(null)
const { api } = useCivitasApi()

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
    const { response: parkirResponse, error: parkirError } = await api.user.getParkirAktif()

    // Unwrap the parkir data
    const parkirData = unwrapResponseJson(parkirResponse)

    // Assuming parkirData.data is a reactive array
    if (Array.isArray(parkirData?.data) && parkirData.data.length === 0)
      parkirItems.value = null // Set to null if the array is empty
    else
      parkirItems.value = parkirData?.data || null // If not empty, set the data, otherwise null
  }
  catch (err: any) {
    errordata.value = err?.message || 'Terjadi kesalahan saat mengambil data parkir'
    console.error('Gagal mengambil data parkir:', errordata.value)
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

const daysLeft = computed(() => {
  if (!parkirItems.value)
    return 0

  const endDate = new Date(parkirItems.value.date_end_service)
  const now = new Date()

  return Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))
})

const parkirStatus = computed(() => {
  if (errordata.value) {
    // If there's an error, set the status to "Periksa Status Parkir"
    return 'Periksa Status Parkir'
  }

  return daysLeft.value > 0 ? 'Parkir Aktif' : 'Parkir Non Aktif'
})

const progress = computed(() => {
  if (!parkirItems.value)
    return 0

  const endDate = new Date(parkirItems.value.date_end_service)
  const startDate = new Date(parkirItems.value.date_start_service)
  const now = new Date()

  // Reverse the calculation: 100% when starting, 0% when ending
  return Math.max(0, Math.min(100, ((endDate - now) / (endDate - startDate)) * 100))
})

// Fetch data from API
onMounted(() => {
  getProfileData()
  getParkirData()
})

// Fetch profile header
onMounted(() => {
  profileHeaderData.value = {
    coverImg,
    profileImg,
  }
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

// Panggil `checkBirthday` saat `tglLahir` berubah
watch(tglLahir, checkBirthday)

// Jalankan `checkBirthday` saat komponen dimuat
onMounted(checkBirthday)

const umur = computed(() => {
  if (!tglLahir.value)
    return 'Data tidak tersedia'

  const birthDate = dayjs(tglLahir.value) // or dayjs(tglLahir.value)
  if (!birthDate.isValid())
    return 'Format tanggal tidak valid'

  const today = dayjs('2025-05-09') // fixed for testing

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

  const today = dayjs()
  let nextBirthday = birthDate.year(today.year())

  // Jika ulang tahun sudah lewat tahun ini, ambil ulang tahun tahun depan
  if (nextBirthday.isBefore(today))
    nextBirthday = birthDate.year(today.year() + 1)

  const diff = dayjs.duration(nextBirthday.diff(today))

  return `${diff.months()} bulan, ${diff.days()} hari`
})

const goToParking = () => {
  window.open('https://parkir.ui.ac.id/apps/site/index', '_blank')
}

const dialog = ref(false)

function openDialog() {
  dialog.value = true
}

function handleParkirClick() {
  const Aktif
    = daysLeft > 0

  if (Aktif)
    openDialog()

  else goToParking()
}
</script>

<template>
  <VCard v-if="profileHeaderData">
    <!-- Efek animasi Happy Birthday -->
    <VAlert
      v-if="isBirthday"
      type="info"
      class="happy-birthday"
    >
      🎉 Selamat Ulang Tahun! 🎉<br>
      🥳🎂🎈<br>
      🥳 Semoga harimu menyenangkan! 🥳
    </VAlert>

    <VImg
      :src="profileHeaderData.coverImg"
      min-height="125"
      max-height="250"
      cover
    />

    <VCardText
      v-if="isAuthenticated"
      class="d-flex align-bottom flex-sm-row flex-column justify-center gap-x-6"
    >
      <div class="d-flex h-0">
        <VAvatar
          rounded="circle"
          size="130"
          :image="profileHeaderData.profileImg"
          class="user-profile-avatar mx-auto"
        >
          <PersonAvatar style="block-size: 120px; inline-size: 120px;" />
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
              <div class="text-body-1 font-weight-medium">
                <!-- {{ keycloakStore.civitas[0].toUpperCase() + keycloakStore.civitas.slice(1) }} -->
                {{ keycloakStore.civitas == 'dosen' ? 'STAF' : keycloakStore.civitas.toUpperCase() }}
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
                  v-if="daysLeft.value > 0"
                  activator="parent"
                  location="top"
                >
                  <div class="d-flex flex-column p-2">
                    <div class="d-flex align-center gap-x-2">
                      <VIcon
                        size="20"
                        icon="ri-calendar-line"
                      />
                      <span>Mulai: {{ parkirItems.date_start_service }}</span>
                    </div>
                    <div class="d-flex align-center gap-x-2">
                      <VIcon
                        size="20"
                        icon="ri-calendar-check-line"
                      />
                      <span>Berakhir: {{ parkirItems.date_end_service }}</span>
                    </div>
                    <div class="d-flex align-center gap-x-2">
                      <VIcon
                        size="20"
                        icon="ri-time-line"
                      />
                      <span>{{ daysLeft }} hari tersisa</span>
                    </div>
                    <VProgressLinear
                      :model-value="progress"
                      color="primary"
                      height="6"
                      rounded
                    />
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
                        <span>Mulai: {{ parkirItems.date_start_service }}</span>
                      </div>
                      <div class="d-flex align-center gap-x-2 mb-2">
                        <VIcon
                          size="20"
                          icon="ri-calendar-check-line"
                        />
                        <span>Berakhir: {{ parkirItems.date_end_service }}</span>
                      </div>
                      <div class="d-flex align-center gap-x-2 mb-4">
                        <VIcon
                          size="20"
                          icon="ri-time-line"
                        />
                        <span>{{ daysLeft }} hari tersisa</span>
                      </div>
                      <VProgressLinear
                        :model-value="progress"
                        color="primary"
                        height="6"
                        rounded
                      />
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
          </div>

          <VBtn
            class="bg-error"
            prepend-icon="ri-logout-box-r-line"
            @click="logoutUser"
          >
            Logout
          </VBtn>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style lang="scss">
.user-profile-avatar {
  border: 5px solid rgb(var(--v-theme-surface));
  background-color: rgb(var(--v-theme-surface)) !important;
  inset-block-start: -3rem;

  .v-img__img {
    border-radius: 0.375rem;
  }
}

/* Animasi Happy Birthday */
.happy-birthday {
  animation: bounce 1.5s infinite alternate ease-in-out;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-10px);
  }
}
</style>
