<script lang="ts" setup>
import { useKeycloakStore } from '@core/stores/keycloakStore'
import { computed, onMounted, ref } from 'vue'

const keycloakStore = useKeycloakStore()
const isAuthenticated = computed(() => keycloakStore.authenticated)

// Updated interface to match the new API response structure
interface ShiftData {
  nip: string
  nama: string
  shift: string
  shift_date: string
  shift_start: string // Time only, e.g., "08:00"
  shift_end: string // Time only, e.g., "16:00"
  break_start?: string
  break_end?: string
  start_time?: string // Full datetime string, e.g., "2025-07-01 09:24"
  end_time?: string // Full datetime string, e.g., "2025-07-01 18:53"
}

const shifts = ref<ShiftData[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')

const headersShift = [
  { title: 'Tanggal', key: 'shift_date', sortable: true },
  { title: 'Nama Hari', key: 'day_name', sortable: false },
  { title: 'Shift', key: 'shift', sortable: false },
  { title: 'Jadwal Shift', key: 'shift_schedule', sortable: false },
  { title: 'Jadwal Istirahat', key: 'break_schedule', sortable: false },
  { title: 'Mulai Aktual', key: 'actual_start_time', sortable: false },

  // Grouped header for break times (Waktu Istirahat) with two child columns
  {
    title: 'Waktu Istirahat',
    key: 'waktu_istirahat',
    sortable: false,
    children: [
      { title: 'Break Start', key: 'break_start', sortable: false },
      { title: 'Break End', key: 'break_end', sortable: false },
    ],
  },
  { title: 'Selesai Aktual', key: 'actual_end_time', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
]

const { api } = useCivitasApi()

async function fetchShiftData() {
  loading.value = true
  error.value = ''

  try {
    const { response, error: apiError } = await api.user.getAttendance()

    const data = response.value // Unwrap the inner ref if it's a Ref<any[]>

    if (data) {
      // Map the raw API data directly to the shifts ref
      shifts.value = data.map((item: any) => ({
        nip: item.nip,
        nama: item.nama,
        shift: item.shift,
        shift_date: item.shift_date,
        shift_start: item.shift_start, // Already time-only from API
        shift_end: item.shift_end, // Already time-only from API
        break_start: item.break_start,
        break_end: item.break_end,
        start_time: item.start_time, // Full datetime string from API
        end_time: item.end_time, // Full datetime string from API
      }))

      // Sort the raw shifts data by date
      shifts.value.sort((a, b) => new Date(b.shift_date).getTime() - new Date(a.shift_date).getTime())
    }
    else {
      shifts.value = [] // Ensure it's an empty array if no data
    }
  }
  catch (err: any) {
    error.value = err.message || 'Terjadi kesalahan saat mengambil data'
    console.error('Fetch error:', err)
  }
  finally {
    loading.value = false
  }
}

function getDayName(dateString: string) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const date = new Date(dateString)

  return days[date.getDay()]
}

const resolveDayColor = (day: string) => {
  if (day === 'Sabtu' || day === 'Minggu')
    return 'error' // Assuming 'error' maps to a red-like color

  return 'primary' // Default color for weekdays
}

function getHour(dateTimeString: string | undefined) {
  if (!dateTimeString)
    return '-'

  // Split by space and take the last part (time)
  const parts = dateTimeString.split(' ')

  return parts.length === 2 ? parts[1] : dateTimeString // Handles cases where it might already be just time
}

function getStatus(actualStart: string | undefined, actualEnd: string | undefined) {
  if (!actualStart && !actualEnd)
    return 'Tidak Ada'
  if (!actualStart || !actualEnd)
    return 'Belum Lengkap' // Changed from 'Belum Hitung' for better clarity

  // In a real scenario, you'd compare actual times with shift_start/shift_end
  // to determine 'On Time', 'Terlambat', 'Pulang Cepat', etc.
  // For now, if both exist, we assume 'On Time' or 'Complete'
  return 'Selesai' // Changed from 'On Time' to 'Selesai' as both times are present
}

const resolveStatusColor = (status: string) => {
  if (status === 'Selesai')
    return 'success'
  if (status === 'Belum Lengkap')
    return 'primary'
  if (status === 'Tidak Ada')
    return 'error'

  // Add more status colors if you introduce 'Terlambat', 'Pulang Cepat' etc.
  return 'secondary' // Default fallback
}

// Computed property to process raw shifts into display-ready format
const processedShifts = computed(() => {
  return shifts.value.map(shift => {
    const dayName = getDayName(shift.shift_date)
    const shiftSchedule = `${shift.shift_start} - ${shift.shift_end}`
    const breakSchedule = (shift.break_start && shift.break_end) 
      ? `${shift.break_start} - ${shift.break_end}` 
      : '-'
    const status = getStatus(shift.start_time, shift.end_time)

    return {
      ...shift, // Keep all original fields
      day_name: dayName,
      shift_schedule: shiftSchedule,
      break_schedule: breakSchedule,
      status,
      actual_start_time: getHour(shift.start_time), // Formatted time for display
      actual_end_time: getHour(shift.end_time), // Formatted time for display
    }
  })
})

const filteredShifts = computed(() => {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const currentDate = today.getDate()

  return processedShifts.value
    .filter(shift => {
      const shiftDate = new Date(shift.shift_date)

      return (
        shiftDate.getFullYear() === currentYear
        && shiftDate.getMonth() === currentMonth
        && shiftDate.getDate() <= currentDate
      )
    })
    .filter(shift => {
      if (!searchQuery.value)
        return true

      // Search across all relevant fields, including newly derived ones
      const searchLower = searchQuery.value.toLowerCase()

      return (
        shift.shift_date.toLowerCase().includes(searchLower)
        || shift.day_name.toLowerCase().includes(searchLower)
        || shift.shift.toLowerCase().includes(searchLower)
        || shift.shift_schedule.toLowerCase().includes(searchLower)
        || shift.break_schedule.toLowerCase().includes(searchLower)
        || shift.actual_start_time.toLowerCase().includes(searchLower)
        || shift.actual_end_time.toLowerCase().includes(searchLower)
        || shift.status.toLowerCase().includes(searchLower)
      )
    })
})

onMounted(() => {
  if (isAuthenticated.value)
    fetchShiftData()
})
</script>

<template>
  <VCard class="project-list">
    <!-- Custom Header -->
    <div class="text-h5 mb-4">
      Log Absen
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
      v-else-if="filteredShifts.length === 0"
      class="riwayat-empty"
    >
      <VAlert
        type="info"
        dense
      >
        Tidak ada data absen ditemukan.
      </VAlert>
    </div>
    <div
      v-else
      class="table-wrapper"
    >
      <VDataTable
        :headers="headersShift"
        :items="filteredShifts"
        :loading="loading"
        loading-text="Memuat data..."
        class="modern-table"
        density="comfortable"
        :items-per-page="-1"
        fixed-header
      >
        <!-- Tanggal -->
        <template #item.shift_date="{ item }">
          {{ item.shift_date }}
        </template>

        <!-- Nama Hari -->
        <template #item.day_name="{ item }">
          <VChip
            :color="resolveDayColor(item.day_name)"
            :class="`text-${resolveDayColor(item.day_name)}`"
            size="small"
            class="font-weight-medium"
          >
            {{ item.day_name }}
          </VChip>
        </template>

        <!-- Jadwal Shift -->
        <template #item.shift_schedule="{ item }">
          {{ item.shift_schedule }}
        </template>

        <!-- Jadwal Istirahat -->
        <template #item.break_schedule="{ item }">
          {{ item.break_schedule }}
        </template>

        <!-- Mulai Aktual -->
        <template #item.actual_start_time="{ item }">
          {{ item.actual_start_time }}
        </template>

        <!-- Break Start -->
        <template #item.break_start="{ item }">
          {{ item.break_start || '-' }}
        </template>

        <!-- Break End -->
        <template #item.break_end="{ item }">
          {{ item.break_end || '-' }}
        </template>

        <!-- Selesai Aktual -->
        <template #item.actual_end_time="{ item }">
          {{ item.actual_end_time }}
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <VChip
            :color="resolveStatusColor(item.status)"
            :class="`text-${resolveStatusColor(item.status)}`"
            size="small"
            class="font-weight-medium"
          >
            {{ item.status }}
          </VChip>
        </template>
      </VDataTable>
    </div>
  </VCard>
</template>

<style lang="scss">
.project-list {
  padding: 20px !important;
}

// Modern Table Styles
.modern-table {
  overflow: hidden;
  border: 1.5px solid rgba(var(--v-global-theme-primary), 0.13); /* Using theme primary for border */
  border-radius: 14px !important;
  box-shadow: 0 2px 12px 0 rgba(60, 60, 60, 6%);
  inline-size: 100%;
  min-inline-size: 800px; /* Ensure minimum width for desktop view */
}

.modern-table ::v-deep thead th {
  background-color: #f5f5f5 !important;
  border-block-end: 2px solid #ddd !important;
  color: #2c2c2c !important;
  font-weight: 600 !important;
  padding-block: 12px !important;
  padding-inline: 1.5em !important;
  text-align: center !important;
  vertical-align: middle !important;
}

.modern-table :deep(tbody tr) {
  border-block-end: 1px solid #e0e0e0;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.modern-table ::v-deep tbody tr {
  border-block-end: 1px solid #e0e0e0;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.modern-table ::v-deep tbody tr:hover {
  z-index: 2;
  border-color: rgba(var(--v-global-theme-primary), 0.25);
  box-shadow: 0 2px 8px 0 rgba(var(--v-global-theme-primary), 0.1);
}

/* Force center for Vuetify table header cells (covers grouped headers like Waktu Istirahat) */
::v-deep(.v-table > .v-table__wrapper > table > thead > tr > th) {
  text-align: center !important;
}

/* Ensure header content spans full width and centers its children */
::v-deep(.v-data-table-header__content) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  inline-size: 100% !important;
}

.table-wrapper {
  box-sizing: border-box;
  inline-size: 100%;
  overflow-x: auto;
  padding-block-end: 16px;
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
