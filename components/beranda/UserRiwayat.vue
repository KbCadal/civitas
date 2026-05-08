<script lang="ts" setup>
import { useKeycloakStore } from '@core/stores/keycloakStore'
import { computed, onMounted, ref } from 'vue'
import { useCivitasApi } from '@/composables/useApi'

const keycloakStore = useKeycloakStore()
const isAuthenticated = computed(() => keycloakStore.authenticated)

const items = ref<any[]>([])
const expandedRows = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')

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
    const { response } = await api.user.getRiwayatAkademik()

    // Accept both Ref<Array> and Array
    const raw = Array.isArray(response.value) ? response.value : response.value?.value
    if (!raw || !Array.isArray(raw)) {
      error.value = 'Data tidak ditemukan'

      return
    }

    // Only show rows with STATUS === 'Aktif'
    items.value = raw
      .filter((item: any) => item.STATUS === 'Aktif')
      .map((item: any, idx: number) => {
        const expandedFiltered = Object.values(item.IRS || {})
          .filter((mk: any) => mk.STATUS !== 'Kosong')
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
      })
      .filter(item => item.expanded.length > 0)
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
        (mk.NM_MK && mk.NM_MK.toLowerCase().includes(query))
        || (mk.KD_MK && mk.KD_MK.toLowerCase().includes(query))
        || (mk.NILAI_HURUF && mk.NILAI_HURUF.toLowerCase().includes(query)),
      )

      const matchParent = [item.THN, item.SEMESTER, item.STATUS, item.IPK, item.IPS].some(field =>
        String(field).toLowerCase().includes(query),
      )

      if (filteredMK.length > 0 || matchParent) {
        return {
          ...item,
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
    <div
      class="search-container mb-4"
      style="padding-inline: 16px;"
    >
      <VTextField
        v-model="searchQuery"
        label="Cari Mata Kuliah, Semester, Tahun, atau Nilai"
        placeholder="Contoh: Pancasila, 2023, A"
        append-inner-icon="ri-search-line"
        clearable
        single-line
        hide-details
        dense
        outlined
        style="border-radius: 12px;"
      />
    </div>

    <div
      v-if="loading"
      class="riwayat-loading"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
      <span>Memuat data...</span>
    </div>
    <div
      v-else-if="error"
      class="riwayat-error"
    >
      <VAlert
        type="error"
        dense
      >
        {{ error }}
      </VAlert>
    </div>
    <div
      v-else-if="filteredRiwayat.length === 0"
      class="riwayat-empty"
    >
      <VAlert
        type="info"
        dense
      >
        Tidak ada data ditemukan.
      </VAlert>
    </div>
    <div
      v-else
      class="table-wrapper"
    >
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
        class="modern-table"
        density="comfortable"
      >
        <template #expanded-row="{ item }">
          <tr>
            <td
              colspan="100%"
              class="expanded-row-td"
            >
              <div class="expanded-card">
                <VDataTable
                  :headers="expandedHeaders"
                  :items="item.expanded"
                  density="compact"
                  hide-default-footer
                  style="border-radius: 12px;"
                >
                  <template #item.STATUS="{ item }">
                    <VChip
                      :color="item.STATUS === 'Lulus' ? 'primary' : undefined"
                      class="font-weight-medium"
                      size="small"
                      variant="elevated"
                    >
                      {{ item.STATUS }}
                    </VChip>
                  </template>
                </VDataTable>
              </div>
            </td>
          </tr>
        </template>

        <template #item.THN="{ item }">
          <div class="d-flex align-center gap-2">
            <VIcon
              icon="ri-calendar-line"
              size="18"
              class="table-accent"
            />
            <span class="font-weight-bold">{{ item.THN }}/{{ Number(item.THN) + 1 }}</span>
          </div>
        </template>

        <template #item.STATUS="{ item }">
          <VChip
            :color="resolveStatusColor(item.STATUS) === 'primary' ? 'primary' : undefined"
            class="font-weight-medium"
            size="small"
            variant="elevated"
          >
            {{ item.STATUS }}
          </VChip>
        </template>

        <template #item.IPK="{ item }">
          <span class="table-accent font-weight-bold">{{ item.IPK }}</span>
        </template>
        <template #item.IPS="{ item }">
          <span class="table-accent font-weight-bold">{{ item.IPS }}</span>
        </template>
      </VDataTable>
    </div>
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

.table-wrapper {
  box-sizing: border-box;
  inline-size: 100%;
  overflow-x: auto;
  padding-block-end: 16px;
  padding-inline: 16px;
}

.modern-table {
  overflow: hidden;
  border: 1.5px solid rgba(var(--v-global-theme-primary), 0.13);
  border-radius: 14px !important;
  box-shadow: 0 2px 12px 0 rgba(60, 60, 60, 6%);
  inline-size: 100%;
  min-inline-size: 800px;
}

.modern-table :deep(tbody tr) {
  border-block-end: 1px solid #e0e0e0;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.modern-table :deep(tbody tr:hover) {
  z-index: 2;
  border-color: rgba(var(--v-global-theme-primary), 0.25);
  box-shadow: 0 2px 8px 0 rgba(var(--v-global-theme-primary), 0.1);
}

.expanded-row-td {
  padding: 0;
  background: transparent;
  border-block-start: 2px dashed rgba(var(--v-global-theme-primary), 0.18);
  border-end-end-radius: 14px;
  border-end-start-radius: 14px;
}

.expanded-card {
  overflow: hidden;
  border: 1.5px dashed rgba(var(--v-global-theme-primary), 0.18);
  border-radius: 14px;
  margin-block: 12px;
  margin-inline: 0;
}

.ml-4 {
  margin-inline-start: 0;
}

.table-accent {
  color: color-mix(in srgb, rgba(var(--v-global-theme-primary)) 90%, black 10%);
}

.search-container {
  display: flex;
  justify-content: flex-end;
}

.riwayat-loading,
.riwayat-error,
.riwayat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block: 32px;
  padding-inline: 0;
}
</style>
