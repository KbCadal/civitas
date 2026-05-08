<script setup lang="ts">
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import { computed, onMounted, ref } from 'vue'

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
  <VCard class="project-list">
    <!-- Custom Header -->
    <div class="text-h5 mb-4">
      Status Peminjaman Buku
    </div>
    <!-- Search Input -->
    <div class="search-container mb-4">
      <VTextField
        v-model="searchQuery"
        label="Search"
        placeholder="Search ..."
        append-inner-icon="ri-search-line"
        clearable
        single-line
        hide-details
        dense
        outlined
      />
    </div>

    <VDataTable
      :headers="logHeaders"
      :items="filteredItems"
      hide-default-footer
      fixed-header
      item-value="tglpinjam"
      :sort-by="['tglpinjam']"
      :sort-asc="[true]"
    />
  </VCard>
</template>

<style lang="scss">
.project-list {
  padding: 20px !important;
}

.jadwalShift {
  .v-table {
    &--density-default {
      .v-table__wrapper {
        table {
          thead {
            th {
              border-block-end: 2px solid #ddd;
              font-weight: 600;
              padding-block: 12px;
              padding-inline: 1.5em;
            }
          }

          tbody {
            tr {
              td {
                border-block-end: 1px solid #eee;
                min-block-size: auto;
                padding-block: 8px;
                padding-inline: 1em;
                vertical-align: top;

                &.vti-table__td--Jadwal {
                  font-weight: 500;
                }
              }
            }
          }
        }
      }
    }
  }
}

.search-container {
  display: flex;
  justify-content: flex-end;
}
</style>
