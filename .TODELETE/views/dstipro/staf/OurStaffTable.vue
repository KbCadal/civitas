<script setup lang="ts">
import { useKeycloakStore } from '@/@core/stores/keycloakStore'

const props = defineProps<Props>()

const { api } = useCivitasApi()

const keycloakStore = useKeycloakStore()

// Gunakan computed agar selalu reaktif
const isAuthenticated = computed(() => keycloakStore.authenticated)

interface Props {
  searchQuery: string
}

// List NIP Staf DSTI
const listStaf = [
  { nama: 'Agus Mulyana', nip: '141113024' },
  { nama: 'Akmal Gafar Putra', nip: '1408150023' },
  { nama: 'Andri Setyawan', nip: '100140310251109891' },
  { nama: 'Anggi Saputra', nip: '141125004' },
  { nama: 'Ardiansyah', nip: '100140310282903891' },
  { nama: 'Dina Mardia', nip: '140825006' },
  { nama: 'Muh. Bahrian Shalat', nip: '198309102022073001' },
  { nama: 'M. Budi Utama', nip: '198502232009121002' },
  { nama: 'Renia Fathiayusa', nip: '141113007' },
]

const loading = ref(false)
const detailedStaff = ref<any[]>([])
const selectedStaff = ref<any>(null) // Untuk staff yang dipilih untuk View/Delete
const isViewDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)

// Fungsi untuk mendapatkan data lengkap staf
async function fetchDetailedStaff() {
  loading.value = true
  detailedStaff.value = []

  for (const staf of listStaf) {
    try {
      // const hrisEndpoint = `https://api.ui.ac.id/staf/${staf.nip}`;
      // const response = await fetch(hrisEndpoint, {
      //   headers: {
      //     Authorization: `Bearer ${keycloakStore.accessToken}`,
      //   },
      // });

      const stafNIP = staf.nip
      const { response, error } = await api.staf.getStafData(stafNIP)

      const data = response.value?.value // ✅ UNWRAP the inner ref

      detailedStaff.value.push({
        ...staf,
        kategori: data.employee_category || '-',
        foto: data.employee_photo || '-',
        jabatan: data.jabatan_pekerjaan || '-',
        unit: data.organization_unit || '-',
        posisi: data.posisi || '-',
      })
    }
    catch (error) {
      console.error(error)
      detailedStaff.value.push({
        ...staf,
        kategori: 'Error fetching data',
        foto: '-',
        jabatan: '-',
        unit: '-',
        posisi: '-',
      })
    }
  }

  loading.value = false
}

onMounted(() => {
  fetchDetailedStaff()
})

// Daftar header tabel
const headers = [
  { title: 'Nama', align: 'start', key: 'nama', sortable: true },
  { title: 'NIP', key: 'nip', sortable: true },
  { title: 'Foto', key: 'foto', sortable: false },
  { title: 'Unit Organisasi', key: 'unit', sortable: true },
  { title: 'Posisi', key: 'posisi', sortable: true },
  { title: 'Aksi', key: 'actions', align: 'center', sortable: false },
]

// Filter data berdasarkan query pencarian dari props
const filteredStaff = computed(() => {
  if (!props.searchQuery)
    return detailedStaff.value
  const query = props.searchQuery.toLowerCase()

  return detailedStaff.value.filter(
    staff =>
      staff.nama.toLowerCase().includes(query)
      || staff.nip.includes(query)
      || staff.unit.toLowerCase().includes(query)
      || staff.posisi.toLowerCase().includes(query),
  )
})

// Fungsi untuk membuka dialog View
function openViewDialog(staff: any) {
  selectedStaff.value = staff
  isViewDialogOpen.value = true
}

// Fungsi untuk membuka dialog Delete
function openDeleteDialog(staff: any) {
  selectedStaff.value = staff
  isDeleteDialogOpen.value = true
}

// Fungsi untuk menghapus staf
function deleteStaff() {
  if (selectedStaff.value)
    detailedStaff.value = detailedStaff.value.filter(staff => staff.nip !== selectedStaff.value.nip)

  isDeleteDialogOpen.value = false
}
</script>

<template>
  <div v-if="isAuthenticated">
    <VCard class="mb-6">
      <VCardText>
        <!-- Header -->
        <div class="d-flex justify-space-between align-center flex-wrap gap-4 mb-6">
          <div>
            <h5 class="text-h5">
              Our Staff
            </h5>
            <div class="text-body-1">
              From All Direktorat
            </div>
          </div>
        </div>

        <!-- Tabel Staf -->
        <VDataTable
          :headers="headers"
          :items="filteredStaff"
          :loading="loading"
          item-value="nip"
          class="elevation-1"
          :items-per-page="10"
        >
          <!-- Kolom Foto -->
          <template #item.foto="{ item }">
            <img
              v-if="item.foto !== '-'"
              :src="item.foto"
              alt="Foto Staf"
              style="border-radius: 50%; block-size: 50px; inline-size: 50px;"
            >
            <span v-else>Tidak Ada Foto</span>
          </template>

          <!-- Kolom Aksi -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-2 justify-center">
              <VBtn
                icon
                size="small"
                variant="outlined"
                color="primary"
                @click="() => openViewDialog(item)"
              >
                <VIcon icon="ri-eye-line" />
              </VBtn>
              <VBtn
                icon
                size="small"
                variant="outlined"
                color="error"
                @click="() => openDeleteDialog(item)"
              >
                <VIcon icon="ri-delete-bin-line" />
              </VBtn>
            </div>
          </template>
        </VDataTable>
      </VCardText>
    </VCard>

    <!-- Dialog View -->
    <VDialog
      v-model="isViewDialogOpen"
      persistent
      :max-width="$vuetify.display.smAndDown ? 'auto' : 500"
    >
      <!-- 👉 dialog close btn -->
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="isViewDialogOpen = false"
      />

      <VCard class="pa-sm-5 pa-3">
        <VCardTitle>
          <h5 class="text-h5 mb-1">
            <VIcon
              size="18"
              class="mb-1 bg-primary rounded-0"
            >
              ri-user-follow-fill
            </VIcon> {{ selectedStaff?.nama || 'Staff Details' }}
          </h5>
        </VCardTitle>
        <VCardText>
          <div class="pa-2">
            <VImg
              :src="selectedStaff?.foto"
              alt="Foto"
              class="cursor-pointer"
              style="inline-size: 100%; max-block-size: 200px;"
            />
          </div>
          <div class="mb-2">
            <VAlert
              color="primary"
              variant="tonal"
            >
              <p class="mb-0">
                <strong>NIP:</strong> {{ selectedStaff?.nip }}
              </p>
              <p class="mb-0">
                <strong>Unit Organisasi:</strong> {{ selectedStaff?.unit }}
              </p>
              <p class="mb-0">
                <strong>Posisi:</strong> {{ selectedStaff?.posisi }}
              </p>
            </VAlert>
          </div>
        </VCardText>
        <VCardActions>
          <VBtn
            variant="tonal"
            class="bg-primary"
            color="white"
            @click="isViewDialogOpen = false"
          >
            Close
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Delete -->
    <VDialog
      v-model="isDeleteDialogOpen"
      persistent
      :max-width="$vuetify.display.smAndDown ? 'auto' : 400"
    >
      <!-- 👉 dialog close btn -->
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="isDeleteDialogOpen = false"
      />

      <VCard class="pa-sm-5 pa-3">
        <VCardTitle class="text-center pb-5 text-h4">
          Delete Staff
        </VCardTitle>
        <VCardText class="text-justify">
          Are you sure you want to delete <strong>{{ selectedStaff?.nama }}</strong>?
        </VCardText>
        <VCardActions>
          <VBtn
            variant="tonal"
            class="bg-error"
            color="white"
            @click="deleteStaff"
          >
            Delete
          </VBtn>
          <VBtn
            variant="outlined"
            @click="isDeleteDialogOpen = false"
          >
            Cancel
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
