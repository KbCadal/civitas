<script lang="ts" setup>
import { useKeycloakStore } from '@core/stores/keycloakStore'
import type { ProfileTab } from '@db/dstipro/profile/types'

// State management
const props = defineProps<Props>()
const keycloakStore = useKeycloakStore()

// Gunakan computed agar selalu reaktif
const isAuthenticated = computed(() => keycloakStore.authenticated)

// const isAuthenticated = keycloakStore.authenticated;

interface Props {
  data: ProfileTab
}

const items = ref<any[]>([])
const loading = ref(false)

// const error = ref('')

const showFull = ref({
  ssouser: false,
  nim: false,
  nip: false,
  nik: false,
  mobile: false,
  emailui: false,
  emaillain: false,
})

const isTooltipKontakVisible = ref(false)
const { api } = useCivitasApi()

const error = ref('')

const academicStatus = ref<'Aktif' | 'Tidak Aktif' | null>(null)

async function getData() {
  loading.value = true
  error.value = ''

  try {
    const { response } = await api.user.getProfile()

    const actualData = unwrapResponseJson(response)

    Object.assign(items.value, actualData)

    // Ambil status akademik terakhir jika mahasiswa
    if (keycloakStore.civitas === 'mahasiswa') {
      const { response: statusResp } = await api.user.getAcademicStatus()
      const statusData = unwrapResponseJson(statusResp)
      if (Array.isArray(statusData) && statusData.length > 0) {
        // Urutkan berdasarkan tahun dan term terbesar
        statusData.sort((a, b) => {
          if (a.THN !== b.THN)
            return Number(b.THN) - Number(a.THN)

          return Number(b.TERM) - Number(a.TERM)
        })

        const latest = statusData[0]

        academicStatus.value = latest.KD_ST_AKADEMIS === '1' ? 'Aktif' : 'Tidak Aktif'
      }
      else {
        academicStatus.value = null
      }
    }
  }
  catch (err: any) {
    error.value = err?.message || 'Terjadi kesalahan saat mengambil data'
    console.error('Gagal mengambil data:', error.value)
  }
  finally {
    loading.value = false
  }
}

function unwrapResponseJson(refObj: any) {
  const isRef = (val: any) => val && typeof val === 'object' && val.__v_isRef

  let data = refObj
  while (isRef(data))
    data = data.value

  // Coba parse jika hasil akhirnya adalah string JSON
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    }
    catch {
      throw new Error('Format string JSON tidak valid')
    }
  }

  if (typeof data === 'object')
    return JSON.parse(JSON.stringify(data))

  throw new Error('Data tidak ditemukan atau format tidak dikenali')
}

// Fetch data from API
onMounted(() => {
  getData()
})

// Fungsi untuk menyembunyikan sebagian data
function maskData(isidata: string, visibleChars = 3): string {
  return isidata.slice(0, visibleChars) + '*'.repeat(Math.max(0, isidata.length - visibleChars))
}

// Helper to localize status
function localizeStatus(status) {
  if (!status)
    return '-'
  if (status === 'ACTIVE')
    return 'Aktif'

  // Capitalize first letter, lower the rest
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}
</script>

<template>
  <VCard class="mb-4">
    <VCardText>
      <!-- SECTION: Tentang -->
      <div class="section-title mb-3 text-h5">
        <VIcon
          icon="ri-information-line"
          size="20"
          class="me-2"
          color="color-mix(in srgb, rgb(var(--v-global-theme-primary)) 85%, black 15%)"
        />
        <span>Tentang</span>
      </div>
      <div
        v-if="isAuthenticated && keycloakStore.civitas !== 'mahasiswa'"
        class="info-section"
      >
        <div class="info-row">
          <VIcon
            icon="ri-pass-valid-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">NIP:</span>
          <span class="info-value">
            {{ showFull.nip ? items?.nip : maskData(items?.nip ?? '') }}
            <VIcon
              :icon="showFull.nip ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="reveal-icon"
              @click="showFull.nip = !showFull.nip"
            />
          </span>
        </div>
        <div class="info-row">
          <VIcon
            icon="ri-user-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Nama:</span>
          <span class="info-value">{{ items.employee_display_name }}</span>
        </div>
        <div class="info-row">
          <VIcon
            icon="ri-star-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Username:</span>
          <span class="info-value">
            {{ showFull.ssouser ? items?.sso_username : maskData(items?.sso_username ?? '') }}
            <VIcon
              :icon="showFull.ssouser ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="reveal-icon"
              @click="showFull.ssouser = !showFull.ssouser"
            />
          </span>
        </div>
        <div class="info-row">
          <VIcon
            icon="ri-flag-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Status:</span>
          <span class="info-value">
            <VChip
              color="color-mix(in srgb, rgb(var(--v-global-theme-primary)) 85%, black 15%)"
              size="small"
              variant="tonal"
            >{{ localizeStatus(items.status) }}</VChip>
          </span>
        </div>
        <div
          v-if="items.posisi_struktural"
          class="info-row"
        >
          <VIcon
            icon="ri-shield-star-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Posisi Struktural:</span>
          <span class="info-value">{{ items.posisi_struktural }}</span>
        </div>
        <div
          v-if="items.tgl_awal_posisi_struktural"
          class="info-row"
        >
          <VIcon
            icon="ri-calendar-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Tgl Awal Posisi Struktural:</span>
          <span class="info-value">{{ items.tgl_awal_posisi_struktural }}</span>
        </div>
        <div
          v-if="items.tgl_akhir_posisi_struktural"
          class="info-row"
        >
          <VIcon
            icon="ri-calendar-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Tgl Akhir Posisi Struktural:</span>
          <span class="info-value">{{ items.tgl_akhir_posisi_struktural }}</span>
        </div>
      </div>
      <div
        v-if="isAuthenticated && keycloakStore.civitas == 'mahasiswa'"
        class="info-section"
      >
        <div class="info-row">
          <VIcon
            icon="ri-pass-valid-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">NIM:</span>
          <span class="info-value">
            {{ showFull.nim ? items?.KD_MHS : maskData(items?.KD_MHS ?? '') }}
            <VIcon
              :icon="showFull.nim ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="reveal-icon"
              @click="showFull.nim = !showFull.nim"
            />
          </span>
        </div>
        <div class="info-row">
          <VIcon
            icon="ri-user-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Nama:</span>
          <span class="info-value">{{ items.NM_MHS }}</span>
        </div>
        <div class="info-row">
          <VIcon
            icon="ri-flag-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Status Akademik:</span>
          <span class="info-value">
            <VChip
              :color="academicStatus === 'Aktif' ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >{{ academicStatus ?? '-' }}</VChip>
          </span>
        </div>
        <div class="info-row">
          <VIcon
            icon="ri-star-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Username:</span>
          <span class="info-value">
            {{ showFull.ssouser ? items?.USERNAME : maskData(items?.USERNAME ?? '') }}
            <VIcon
              :icon="showFull.ssouser ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="reveal-icon"
              @click="showFull.ssouser = !showFull.ssouser"
            />
          </span>
        </div>
      </div>

      <!-- SECTION: Pegawai -->
      <template v-if="isAuthenticated && keycloakStore.civitas !== 'mahasiswa'">
        <VDivider class="my-4" />
        <div class="section-title mb-3  text-h5">
          <VIcon
            icon="ri-briefcase-4-line"
            size="20"
            class="me-2"
            color="color-mix(in srgb, rgb(var(--v-global-theme-primary)) 85%, black 15%)"
          />
          <span>Pegawai</span>
        </div>
        <div class="info-section">
          <div class="info-row">
            <VIcon
              icon="ri-flag-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Status Pegawai:</span>
            <span class="info-value">{{ items.employment_status }}</span>
          </div>
          <div class="info-row">
            <VIcon
              icon="ri-flag-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Kategori:</span>
            <span class="info-value">{{ items.employee_category }}</span>
          </div>
          <div class="info-row">
            <VIcon
              icon="ri-id-card-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Jabatan:</span>
            <span class="info-value">{{ items.jabatan_pekerjaan }}</span>
          </div>
          <div class="info-row">
            <VIcon
              icon="ri-id-card-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Unit Kerja:</span>
            <span class="info-value">{{ items.organization_unit }}</span>
          </div>
          <div class="info-row">
            <VIcon
              icon="ri-id-card-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Tgl Masuk:</span>
            <span class="info-value">{{ items.join_date }}</span>
          </div>
          <div class="info-row">
            <VIcon
              icon="ri-id-card-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Tgl Pensiun:</span>
            <span class="info-value">{{ items.tgl_akhir_pegawai }}</span>
          </div>
        </div>
      </template>

      <!-- SECTION: Dosen -->
      <template v-if="isAuthenticated && items.employee_category == 'DOSEN'">
        <VDivider class="my-4" />
        <div class="section-title mb-3  text-h5">
          <VIcon
            icon="ri-graduation-cap-line"
            size="20"
            class="me-2"
            color="color-mix(in srgb, rgb(var(--v-global-theme-primary)) 85%, black 15%)"
          />
          <span>Dosen</span>
        </div>
        <div class="info-section">
          <div class="info-row">
            <VIcon
              icon="ri-sticky-note-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">NIDN:</span>
            <span class="info-value">{{ items.nidn }}</span>
          </div>
          <div class="info-row">
            <VIcon
              icon="ri-sticky-note-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Google Scholar ID:</span>
            <span class="info-value">{{ items.google_scholar_id }}</span>
          </div>
          <div class="info-row">
            <VIcon
              icon="ri-sticky-note-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Scopus ID:</span>
            <span class="info-value">{{ items.scopus_id }}</span>
          </div>
          <div class="info-row">
            <VIcon
              icon="ri-sticky-note-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Sinta ID:</span>
            <span class="info-value">{{ items.sinta_id }}</span>
          </div>
        </div>
      </template>

      <!-- SECTION: Struktural -->
      <template v-if="isAuthenticated && items.posisi_struktural">
        <VDivider class="my-4" />
        <div class="section-title mb-3  text-h5">
          <VIcon
            icon="ri-shield-star-line"
            size="20"
            class="me-2"
            color="color-mix(in srgb, rgb(var(--v-global-theme-primary)) 85%, black 15%)"
          />
          <span>Struktural</span>
        </div>
        <div class="info-section">
          <div class="info-row">
            <VIcon
              icon="ri-shield-star-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Jabatan:</span>
            <span class="info-value">{{ items.posisi_struktural }}</span>
          </div>
          <div class="info-row">
            <VIcon
              icon="ri-shield-star-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Tgl Mulai:</span>
            <span class="info-value">{{ items.tgl_awal_posisi_struktural }}</span>
          </div>
          <div class="info-row">
            <VIcon
              icon="ri-shield-star-line"
              size="22"
              class="info-icon"
            />
            <span class="info-label">Tgl Akhir:</span>
            <span class="info-value">{{ items.tgl_akhir_posisi_struktural }}</span>
          </div>
        </div>
      </template>

      <!-- SECTION: Kontak -->
      <VDivider class="my-4" />
      <div class="section-title mb-3  text-h5">
        <VIcon
          icon="ri-contacts-book-line"
          size="20"
          class="me-2"
          color="color-mix(in srgb, rgb(var(--v-global-theme-primary)) 85%, black 15%)"
        />
        <span>Kontak</span>
        <VTooltip
          :model-value="isTooltipKontakVisible"
          location="top"
        >
          <template #activator="{ props }">
            <VIcon
              v-bind="props"
              icon="ri-question-line"
              color="color-mix(in srgb, rgb(var(--v-global-theme-primary)) 85%, black 15%)"
              class="ms-2"
            />
          </template>
          <span>Jika ada data yang tidak lengkap <br>harap dilengkapi di {{ (keycloakStore.civitas == 'mahasiswa')
            ? 'SIAK-NG'
            : 'HRIS-UI' }}</span>
        </VTooltip>
      </div>
      <div
        v-if="isAuthenticated && keycloakStore.civitas !== 'mahasiswa'"
        class="info-section"
      >
        <div class="info-row">
          <VIcon
            icon="ri-smartphone-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Mobile:</span>
          <span class="info-value">
            {{ showFull.mobile ? items?.phone : maskData(items?.phone ?? '', 3) }}
            <VIcon
              :icon="showFull.mobile ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="reveal-icon"
              @click="showFull.mobile = !showFull.mobile"
            />
          </span>
        </div>
        <div
          v-if="items?.email"
          class="info-row"
        >
          <VIcon
            icon="ri-mail-open-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Email lain:</span>
          <span class="info-value">
            {{ showFull.emailui ? items.email : maskData(items.email, 3) }}
            <VIcon
              :icon="showFull.emailui ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="reveal-icon"
              @click="showFull.emailui = !showFull.emailui"
            />
          </span>
        </div>
      </div>
      <div
        v-if="isAuthenticated && keycloakStore.civitas == 'mahasiswa'"
        class="info-section"
      >
        <div class="info-row">
          <VIcon
            icon="ri-mail-open-line"
            size="22"
            class="info-icon"
          />
          <span class="info-label">Email lain:</span>
          <span class="info-value">
            {{ showFull.emailui ? items?.EMAIL_UI : maskData(items?.EMAIL_UI ?? '', 3) }}
            <VIcon
              :icon="showFull.emailui ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="reveal-icon"
              @click="showFull.emailui = !showFull.emailui"
            />
          </span>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.section-title {
  display: flex;
  align-items: center;

  // font-size: 1rem;
  // font-weight: 600;
  gap: 4px;

  // letter-spacing: 0.5px;
  margin-block-end: 8px;
}

.info-section {
  border-radius: 10px;

  /* Flatter look, less shadow */
  box-shadow: 0 1px 4px 0 rgba(60, 60, 60, 2%);
  margin-block-end: 8px;
  padding-block: 10px 6px;
  padding-inline: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 0.97rem;
  gap: 8px;
  margin-block-end: 6px;
  min-block-size: 28px;
}

.info-label {
  overflow: hidden;
  font-size: 0.97em;
  font-weight: 500;
  inline-size: 140px;           /* ensures all labels align */
  min-inline-size: 140px; /* was 100px, increase as needed */
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-value {
  display: flex;
  flex: 1;
  align-items: center;
  border-radius: 5px;
  font-size: 0.97em;
  gap: 5px;
  max-inline-size: 100%;
  min-block-size: 24px;
  overflow-x: auto;
  padding-block: 1px;
  padding-inline: 8px;
}

.info-icon {
  color: color-mix(in srgb, rgb(var(--v-global-theme-primary)) 85%, black 15%);
  font-size: 18px !important;
}

.reveal-icon {
  cursor: pointer;
  font-size: 18px !important;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.reveal-icon:hover {
  opacity: 1;
}

.v-chip {
  font-size: 0.92em;
  font-weight: 500;
  letter-spacing: 0.2px;
}
</style>
