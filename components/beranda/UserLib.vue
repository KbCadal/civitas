<script setup lang="ts">
import { computed, ref } from 'vue'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'

// Store Keycloak
const keycloakStore = useKeycloakStore()

// Data dan state
const items = ref<any[]>([])

const loading = ref(false)
const searchQuery = ref('')

// Header tabel
const logHeaders = [
  { title: 'KOLEKSI', key: 'koleksi' },
  { title: 'TANGGAL PEMINJAMAN', key: 'tglpinjam' },
  { title: 'TANGGAL PENGEMBALIAN', key: 'tglkembali' },
  { title: 'DIPINJAM', key: 'dipinjam' },
  { title: 'PERPANJANGAN', key: 'perpanjangan' },
  { title: 'DENDA', key: 'denda' },
  { title: 'DENDA TOTAL', key: 'dendatotal' },
]

const { api } = useCivitasApi()

// Fungsi ambil data
async function getData() {
  loading.value = true
  try {
    const { response, error } = await api.user.getLib()
    const dataku = response.value?.value // ✅ UNWRAP the inner ref

    // dataku adalah array, tiap elemen punya properti root-level
    const requiredKeys = [
      'denda',
      'dendatotal',
      'dipinjam',
      'koleksi',
      'perpanjangan',
      'tglkembali',
      'tglpinjam',
      'username',
    ]

    // ambil hanya objek yang memiliki semua key di root
    items.value = Array.isArray(dataku)
      ? dataku.filter((r: any) => requiredKeys.every(k => k in r))
      : []
  }
  catch (err) {
    console.error('Gagal mengambil data:', err)
  }
  finally {
    loading.value = false
  }
}

// Panggil saat komponen mount
onMounted(() => {
  getData()
})

// Filter hasil pencarian
const filteredItems = computed(() => {
  if (!searchQuery.value)
    return items.value
  const q = searchQuery.value.toLowerCase()

  return items.value.filter(item =>
    logHeaders.some(
      h => item[h.key] && String(item[h.key]).toLowerCase().includes(q),
    ),
  )
})
</script>

<template>
  <VCard
    title="Status Peminjaman Buku"
    class="riwayatList"
  >
    <!-- Search -->
    <div
      class="search-container mb-4"
      style="padding-inline: 16px;"
    >
      <VTextField
        v-model="searchQuery"
        label="Cari koleksi, tanggal, atau status"
        placeholder="Contoh: Algoritma, 2024-06-01"
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
      v-else-if="filteredItems.length === 0"
      class="riwayat-empty"
    >
      <VAlert
        type="info"
        dense
      >
        Tidak ada data peminjaman ditemukan.
      </VAlert>
    </div>
    <div
      v-else
      class="table-wrapper"
    >
      <VDataTable
        :headers="logHeaders"
        :items="filteredItems"
        hide-default-footer
        fixed-header
        item-value="tglpinjam"
        :sort-by="['tglpinjam']"
        :sort-asc="[true]"
        class="modern-table"
        density="comfortable"
      >
        <template #item.koleksi="{ item }">
          <div class="d-flex align-center gap-2">
            <VIcon
              icon="ri-book-2-line"
              size="18"
              class="table-accent"
            />
            <span class="font-weight-bold">{{ item.koleksi }}</span>
          </div>
        </template>
        <template #item.dipinjam="{ item }">
          <VChip
            :color="item.dipinjam === 'Ya' ? 'primary' : undefined"
            class="font-weight-medium"
            size="small"
            variant="elevated"
          >
            {{ item.dipinjam }}
          </VChip>
        </template>
        <template #item.perpanjangan="{ item }">
          <span class="table-accent font-weight-bold">{{ item.perpanjangan }}</span>
        </template>
        <template #item.denda="{ item }">
          <span class="font-mono">{{ item.denda }}</span>
        </template>
        <template #item.dendatotal="{ item }">
          <span class="font-mono table-accent">{{ item.dendatotal }}</span>
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

.table-accent {
  color: color-mix(in srgb, rgba(var(--v-global-theme-primary)) 100%, black 0%);
}

.search-container {
  display: flex;
  justify-content: flex-end;
}

.riwayat-loading,
.riwayat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block: 32px;
  padding-inline: 0;
}

.font-mono {
  font-family: "JetBrains Mono", "Fira Mono", Consolas, monospace;
}
</style>
