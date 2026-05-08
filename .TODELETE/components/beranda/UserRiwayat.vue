<script lang="ts" setup>
import { useKeycloakStore } from '@core/stores/keycloakStore'
import { computed, onMounted, ref } from 'vue'

const keycloakStore = useKeycloakStore()
const isAuthenticated = computed(() => keycloakStore.authenticated)

const items = ref<any[]>([])
const expandedRows = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')

// Headers
const riwayatHeaders = [
  { title: '', key: 'data-table-expand', sortable: false },
  { title: 'Tahun', key: 'THN', sortable: false },
  { title: 'Term', key: 'TERM', sortable: false },
  { title: 'Semester', key: 'SEMESTER', sortable: true },
  { title: 'Status', key: 'STATUS', sortable: false },
  { title: 'IPS', key: 'IPS', sortable: true },
  { title: 'IPK', key: 'IPK', sortable: true },
]

const expandedHeaders = [
  { title: 'Kode MK', key: 'KD_MK', sortable: true },
  { title: 'Nama MK', key: 'NM_MK', sortable: true },
  { title: 'Kelas', key: 'NM_KLS_MK', sortable: false },
  { title: 'Status', key: 'STATUS', sortable: false },
  { title: 'Nilai', key: 'NILAI_HURUF', sortable: true },
  { title: 'Pengajar', key: 'PENGAJAR', sortable: false },
]

function resolveStatusColor(status: string) {
  switch (status) {
    case 'Aktif': return 'primary'
    case 'Lulus': return 'success'
    default: return 'default'
  }
}
const { api } = useCivitasApi()

async function getData() {
  loading.value = true
  error.value = ''
  items.value = []

  try {
    const { response, error } = await api.user.getRiwayatAkademik()
    const raw = response.value?.value // ✅ UNWRAP the inner ref

    items.value = raw.map((item: any, idx: number) => {
      const expandedFiltered = Object.values(item.IRS || {})
        .filter((mk: any) => mk.STATUS !== 'Kosong') // Remove STATUS: Kosong
        .map((mk: any) => ({
          KD_MK: mk.KD_MK,
          NM_MK: mk.NM_MK,
          NM_KLS_MK: mk.NM_KLS_MK,
          STATUS: mk.STATUS,
          NILAI_HURUF: mk.NILAI_HURUF,
          PENGAJAR: mk.PENGAJAR ? Object.values(mk.PENGAJAR).join(', ') : '-',
        }))

      return {
        id: `${item.THN}-${item.SEMESTER}-${item.TERM}-${idx}`,
        ...item,
        expanded: expandedFiltered,
      }
    }).filter(item => item.expanded.length > 0) // Optionally remove parent rows with no expanded items
  }
  catch (err: any) {
    error.value = err.message || 'Terjadi kesalahan saat mengambil data'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  getData()
})

const filteredRiwayat = computed(() => {
  if (!searchQuery.value)
    return items.value

  const query = searchQuery.value.toLowerCase()

  return items.value
    .map(item => {
      const filteredMK = item.expanded.filter((mk: any) =>
        mk.NM_MK.toLowerCase().includes(query),
      )

      const matchParent = [item.THN, item.SEMESTER, item.STATUS].some(field =>
        String(field).toLowerCase().includes(query),
      )

      if (filteredMK.length > 0 || matchParent) {
        return {
          ...structuredClone(item),
          expanded: filteredMK.length > 0 ? filteredMK : item.expanded,
        }
      }

      return null
    })
    .filter(Boolean)
})
</script>

<template>
  <VCard
    title="Riwayat Mata Kuliah"
    class="riwayatList"
  >
    <!-- Search -->
    <div class="search-container mb-4 pl-2 pr-2">
      <VTextField
        v-model="searchQuery"
        label="Cari Mata Kuliah atau Semester"
        placeholder="Contoh: Pancasila, 2023"
        append-inner-icon="ri-search-line"
        clearable
        single-line
        hide-details
        dense
        outlined
      />
    </div>

    <!-- Data Table -->
    <VDataTable
      v-model:expanded="expandedRows"
      :headers="riwayatHeaders"
      :items="filteredRiwayat"
      item-value="id"
      hide-default-footer
      fixed-header
      show-expand
      :sort-by="['SEMESTER']"
      :sort-asc="[true]"
    >
      <template #expanded-row="{ item }">
        <tr>
          <td colspan="100%">
            <VDataTable
              :headers="expandedHeaders"
              :items="item.expanded"
              density="compact"
              class="ml-4"
              hide-default-footer
            />
          </td>
        </tr>
      </template>

      <template #item.THN="{ item }">
        <div>
          <h6 class="text-h6">
            {{ `${item.THN}/${Number(item.THN) + 1}` }}
          </h6>
        </div>
      </template>

      <template #item.STATUS="{ item }">
        <VChip
          :color="resolveStatusColor(item.STATUS)"
          class="font-weight-medium"
          size="small"
        >
          {{ item.STATUS }}
        </VChip>
      </template>

      <template #bottom />
    </VDataTable>
  </VCard>
</template>

<style scoped lang="scss">
.riwayatList {
  .v-table__wrapper {
    table tbody tr td {
      block-size: 56px;
    }
  }
}

.search-container {
  display: flex;
  justify-content: flex-end;
}

.ml-4 {
  margin-inline-start: 16px;
}
</style>
