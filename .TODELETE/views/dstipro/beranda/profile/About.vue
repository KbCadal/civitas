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

async function getData() {
  loading.value = true
  error.value = ''

  try {
    const { response } = await api.user.getProfile()

    const actualData = unwrapResponseJson(response)

    Object.assign(items.value, actualData)
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
</script>

<template>
  <VCard class="mb-4">
    <VCardText>
      <div class="text-body-2 text-disabled mb-3">
        TENTANG
      </div>
      <div
        v-if="isAuthenticated && keycloakStore.civitas !== 'mahasiswa'"
        class="d-flex flex-column gap-y-2"
      >
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-pass-valid-line"
            size="24"
          />
          <div class="font-weight-medium">
            NIP:
          </div>
          <div class="text-truncate">
            {{ showFull.nip ? items?.nip : maskData(items?.nip ?? '') }}
            <VIcon
              :icon="showFull.nip ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="cursor-pointer"
              @click="showFull.nip = !showFull.nip"
            />
          </div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-user-line"
            size="24"
          />
          <div class="font-weight-medium">
            Nama:
          </div>
          <div>{{ items.employee_display_name }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-star-line"
            size="24"
          />
          <div class="font-weight-medium">
            Username:
          </div>
          <div class="text-truncate">
            {{ showFull.ssouser ? items?.sso_username : maskData(items?.sso_username ?? '') }}
            <VIcon
              :icon="showFull.ssouser ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="cursor-pointer"
              @click="showFull.ssouser = !showFull.ssouser"
            />
          </div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-pass-valid-line"
            size="24"
          />
          <div class="font-weight-medium">
            NIK:
          </div>
          <div>
            {{ showFull.nik ? items?.nik : maskData(items?.nik ?? '') }}
            <VIcon
              :icon="showFull.nik ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="cursor-pointer"
              @click="showFull.nik = !showFull.nik"
            />
          </div>
        </div>
      </div>

      <div
        v-if="isAuthenticated && keycloakStore.civitas == 'mahasiswa'"
        class="d-flex flex-column gap-y-2"
      >
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-pass-valid-line"
            size="24"
          />
          <div class="font-weight-medium">
            NIM:
          </div>
          <div class="text-truncate">
            {{ showFull.nim ? items?.KD_MHS : maskData(items?.KD_MHS ?? '') }}
            <VIcon
              :icon="showFull.nim ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="cursor-pointer"
              @click="showFull.nim = !showFull.nim"
            />
          </div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-user-line"
            size="24"
          />
          <div class="font-weight-medium">
            Nama:
          </div>
          <div>{{ items.NM_MHS }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-star-line"
            size="24"
          />
          <div class="font-weight-medium">
            Username:
          </div>
          <div class="text-truncate">
            {{ showFull.ssouser ? items?.USERNAME : maskData(items?.USERNAME ?? '') }}
            <VIcon
              :icon="showFull.ssouser ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="cursor-pointer"
              @click="showFull.ssouser = !showFull.ssouser"
            />
          </div>
        </div>
      </div>

      <div
        v-if="isAuthenticated && keycloakStore.civitas !== 'mahasiswa'"
        class="d-flex flex-column gap-y-2"
      >
        <VDivider class="mt-2" />
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-flag-line"
            size="24"
          />
          <div class="font-weight-medium">
            Status:
          </div>
          <div>{{ items.status }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-flag-line"
            size="24"
          />
          <div class="font-weight-medium">
            Status Pegawai:
          </div>
          <div>{{ items.employment_status }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-flag-line"
            size="24"
          />
          <div class="font-weight-medium">
            Kategori:
          </div>
          <div>{{ items.employee_category }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-id-card-line"
            size="24"
          />
          <div class="font-weight-medium">
            Jabatan:
          </div>
          <div>{{ items.jabatan_pekerjaan }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-id-card-line"
            size="24"
          />
          <div class="font-weight-medium">
            Unit Kerja:
          </div>
          <div>{{ items.organization_unit }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-id-card-line"
            size="24"
          />
          <div class="font-weight-medium">
            Tgl Masuk:
          </div>
          <div>{{ items.join_date }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-id-card-line"
            size="24"
          />
          <div class="font-weight-medium">
            Tgl Pensiun:
          </div>
          <div>{{ items.tgl_akhir_pegawai }}</div>
        </div>
      </div>

      <div
        v-if="isAuthenticated && items.employee_category == 'DOSEN'"
        class="d-flex flex-column gap-y-2"
      >
        <VDivider class="mt-2" />
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-sticky-note-line"
            size="24"
          />
          <div class="font-weight-medium">
            NIDN:
          </div>
          <div>{{ items.nidn }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-sticky-note-line"
            size="24"
          />
          <div class="font-weight-medium">
            Google Scholar ID:
          </div>
          <div>{{ items.google_scholar_id }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-sticky-note-line"
            size="24"
          />
          <div class="font-weight-medium">
            Scopus ID:
          </div>
          <div>{{ items.scopus_id }}</div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-sticky-note-line"
            size="24"
          />
          <div class="font-weight-medium">
            Sinta ID:
          </div>
          <div>{{ items.sinta_id }}</div>
        </div>
      </div>

      <div v-if="isAuthenticated && items.posisi_struktural">
        <div class="text-body-2 text-disabled mt-6 mb-3">
          STRUKTURAL
        </div>
        <div class="d-flex flex-column gap-y-2">
          <div class="d-flex align-center gap-x-2">
            <VIcon
              icon="ri-shield-star-line"
              size="24"
            />
            <div class="font-weight-medium">
              Jabatan:
            </div>
            <div>
              {{ items.posisi_struktural }}
            </div>
          </div>
          <div class="d-flex align-center gap-x-2">
            <VIcon
              icon="ri-shield-star-line"
              size="24"
            />
            <div class="font-weight-medium">
              Tgl Mulai:
            </div>
            <div>
              {{ items.tgl_awal_posisi_struktural }}
            </div>
          </div>
          <div class="d-flex align-center gap-x-2">
            <VIcon
              icon="ri-shield-star-line"
              size="24"
            />
            <div class="font-weight-medium">
              Tgl Akhir:
            </div>
            <div>
              {{ items.tgl_akhir_posisi_struktural }}
            </div>
          </div>
        </div>
      </div>

      <div class="text-body-2 text-disabled mt-6 mb-3">
        KONTAK
        <VTooltip
          :model-value="isTooltipKontakVisible"
          location="top"
        >
          <template #activator="{ props }">
            <VIcon
              v-bind="props"
              icon="ri-question-line"
              color="primary"
            />
          </template>
          <span>Jika ada data yang tidak lengkap <br>harap dilengkapi di {{ (keycloakStore.civitas == 'mahasiswa')
            ? 'SIAK-NG'
            : 'HRIS-UI' }}</span>
        </VTooltip>
      </div>
      <div
        v-if="isAuthenticated && keycloakStore.civitas !== 'mahasiswa'"
        class="d-flex flex-column gap-y-2"
      >
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-smartphone-line"
            size="24"
          />
          <div class="font-weight-medium">
            Mobile:
          </div>
          <div class="text-truncate">
            {{ showFull.mobile ? items?.phone : maskData(items?.phone ?? '', 3) }}
            <VIcon
              :icon="showFull.mobile ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="cursor-pointer"
              @click="showFull.mobile = !showFull.mobile"
            />
          </div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-mail-open-line"
            size="24"
          />
          <div class="font-weight-medium">
            Email UI:
          </div>
          <div class="text-truncate">
            {{ showFull.emailui ? items?.email : maskData(items?.email ?? '', 3)
            }}
            <VIcon
              :icon="showFull.emailui ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="cursor-pointer"
              @click="showFull.emailui = !showFull.emailui"
            />
          </div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-mail-open-line"
            size="24"
          />
          <div class="font-weight-medium">
            Email Lain:
          </div>
          <div class="text-truncate">
            {{ showFull.emaillain ? 'nama.anda@gmail.com' : maskData('nama.anda@gmail.com', 3)
            }}
            <VIcon
              :icon="showFull.emaillain ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="cursor-pointer"
              @click="showFull.emaillain = !showFull.emaillain"
            />
          </div>
        </div>
      </div>

      <div
        v-if="isAuthenticated && keycloakStore.civitas == 'mahasiswa'"
        class="d-flex flex-column gap-y-2"
      >
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-mail-open-line"
            size="24"
          />
          <div class="font-weight-medium">
            Email UI:
          </div>
          <div class="text-truncate">
            {{ showFull.emailui ? items?.EMAIL_UI : maskData(items?.EMAIL_UI ?? '', 3)
            }}
            <VIcon
              :icon="showFull.emailui ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="cursor-pointer"
              @click="showFull.emailui = !showFull.emailui"
            />
          </div>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon
            icon="ri-mail-open-line"
            size="24"
          />
          <div class="font-weight-medium">
            Email Lain:
          </div>
          <div class="text-truncate">
            {{ showFull.emaillain ? 'nama.anda@gmail.com' : maskData('nama.anda@gmail.com', 3)
            }}
            <VIcon
              :icon="showFull.emaillain ? 'ri-eye-off-line' : 'ri-eye-line'"
              class="cursor-pointer"
              @click="showFull.emaillain = !showFull.emaillain"
            />
          </div>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;
}
</style>
