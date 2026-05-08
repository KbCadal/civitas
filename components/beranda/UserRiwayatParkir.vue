<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCivitasApi } from '@/composables/useApi'

const { api } = useCivitasApi()
const items = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')

const headers = [
  { title: 'No', key: 'no', align: 'center' },
  { title: 'Nomor Polisi', key: 'noPolisi' },
  { title: 'Lokasi', key: 'lokasi' },
  { title: 'Gate Masuk', key: 'gateMasuk' },
  { title: 'Waktu Masuk', key: 'waktuMasuk' },
  { title: 'Gate Keluar', key: 'gateKeluar' },
  { title: 'Waktu Keluar', key: 'waktuKeluar' },
  { title: 'Operator', key: 'operator', align: 'center' },
  { title: 'Mifare Id', key: 'mifareId', align: 'center' },
  { title: 'Biaya', key: 'biaya', align: 'center' },
  { title: 'Lama Waktu', key: 'lamaWaktu', align: 'center' },
]

function formatDate(dateString: string) {
  if (!dateString)
    return ''
  try {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
  catch {
    return dateString
  }
}

function calculateDuration(entryTime: string, exitTime: string) {
  if (!entryTime || !exitTime)
    return ''
  try {
    const entry = new Date(entryTime)
    const exit = new Date(exitTime)
    const diff = Math.max(0, (exit.getTime() - entry.getTime()) / 1000)
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = Math.floor(diff % 60)

    return `${hours}h ${minutes}m ${seconds}s`
  }
  catch {
    return ''
  }
}

function formatPayment(payment: number) {
  return `Rp ${Number(payment || 0).toLocaleString('id-ID')}`
}

async function getData() {
  loading.value = true
  error.value = ''
  items.value = []

  try {
    const { response } = await api.user.getMyParkingHistory()

    console.log('response.value')
    console.log(response.value)

    const raw = response.value?.data?.items || []

    items.value = raw.map((item: any, idx: number) => ({
      id: item.id,
      no: idx + 1,
      noPolisi: item.license_plate,
      lokasi: item.parking_area,
      gateMasuk: item.gate_entry,
      waktuMasuk: formatDate(item.time_entry),
      gateKeluar: item.gate_exit,
      waktuKeluar: formatDate(item.time_exit),
      operator: item.operator,
      mifareId: item.mifare,
      biaya: formatPayment(item.payment),
      lamaWaktu: calculateDuration(item.time_entry, item.time_exit),
    }))
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

const filteredItems = computed(() => {
  if (!searchQuery.value)
    return items.value
  const query = searchQuery.value.toLowerCase()

  return items.value.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(query),
    ),
  )
})
</script>

<template>
  <VCard
    title="Riwayat Parkir"
    class="riwayatList"
  >
    <!-- Search -->
    <div
      class="search-container mb-4"
      style="padding-inline: 16px;"
    >
      <VTextField
        v-model="searchQuery"
        label="Cari Riwayat Parkir..."
        placeholder="Contoh: B1234XYZ, Salemba"
        append-inner-icon="mdi-magnify"
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
      <span>Memuat data riwayat parkir...</span>
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
      v-else-if="filteredItems.length === 0"
      class="riwayat-empty"
    >
      <VAlert
        type="info"
        dense
      >
        Tidak ada riwayat parkir yang ditemukan.
      </VAlert>
    </div>
    <div
      v-else
      class="table-wrapper"
    >
      <VDataTable
        :headers="headers"
        :items="filteredItems"
        item-value="id"
        hide-default-footer
        density="comfortable"
        class="modern-table"
      >
        <template #item.no="{ item }">
          <VChip
            class="chip-no"
            :style="{ backgroundColor: 'rgba(var(--v-global-theme-primary), 0.12)', color: 'color-mix(in srgb, rgba(var(--v-global-theme-primary)) 70%, black 30%)' }"
            size="small"
            variant="elevated"
          >
            {{ item.no }}
          </VChip>
        </template>
        <template #item.noPolisi="{ item }">
          <span class="font-weight-bold table-accent">
            {{ item.noPolisi }}
          </span>
        </template>
        <template #item.lokasi="{ item }">
          <span class="table-accent">
            {{ item.lokasi }}
          </span>
        </template>
        <template #item.biaya="{ item }">
          <span class="font-weight-bold table-accent">{{ item.biaya }}</span>
        </template>
        <template #item.lamaWaktu="{ item }">
          <span class="font-mono table-accent">{{ item.lamaWaktu }}</span>
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
      vertical-align: middle; // Ensures vertical centering
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

.chip-no {
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.table-accent {
  color: rgb(var(--v-global-theme-primary)); // Use only the primary color for clarity
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
