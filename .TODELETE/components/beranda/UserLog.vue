<script lang="ts" setup>
import { useKeycloakStore } from '@core/stores/keycloakStore'

const keycloakStore = useKeycloakStore()
const isAuthenticated = computed(() => keycloakStore.authenticated)

interface ShiftData {
  shift_date: string
  shift_start: string
  shift_end: string
  shift: string
  start_time?: string
  end_time?: string
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
  { title: 'Mulai Aktual', key: 'start_time', sortable: false },
  { title: 'Selesai Aktual', key: 'end_time', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
]

const { api } = useCivitasApi()

async function fetchShiftData() {
  loading.value = true
  error.value = ''

  try {
    // const apiEndpoint = `https://api.ui.ac.id/my/hr/attendance`;
    // const response = await fetch(apiEndpoint, {
    //   headers: {
    //     Authorization: `Bearer ${keycloakStore.accessToken}`,
    //   },
    // });

    // if (!response.ok) {
    //   throw new Error("Gagal fetch data");
    // }

    const { response, error } = await api.user.getAttendance()

    const data = response.value?.value // ✅ UNWRAP the inner ref

    shifts.value = data
      .map((item: any) => ({
        ...item,
        shift_start: `${item.shift_date} ${item.shift_start || '00:00'}`,
        shift_end: `${item.shift_date} ${item.shift_end || '00:00'}`,
      }))
      .sort((a, b) => new Date(b.shift_date).getTime() - new Date(a.shift_date).getTime())
  }
  catch (err: any) {
    error.value = err.message || 'Terjadi kesalahan saat mengambil data'
  }
  finally {
    loading.value = false
  }
}

function getDayName(date: string) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const dayIndex = new Date(date).getDay()

  return days[dayIndex]
}

const resolveDayColor = (day: string) => {
  if (day === 'Sabtu' || day === 'Minggu')
    return 'error'
}

function getHour(time: string | undefined) {
  if (!time)
    return '-'
  const parts = time.split(' ')

  return parts.length === 2 ? parts[1] : time
}

function getStatus(start: string | undefined, end: string | undefined) {
  if (!start && !end)
    return 'Tidak Ada'
  if (!start || !end)
    return 'Belum Hitung'

  return 'On Time'
}

const resolveStatusColor = (status: string) => {
  if (status === 'On Time')
    return 'success'
  if (status === 'Belum Hitung')
    return 'primary'
  if (status === 'Tidak Ada')
    return 'error'
}

const filteredShifts = computed(() => {
  if (!searchQuery.value)
    return shifts.value

  return shifts.value.filter(shift => {
    const dayName = getDayName(shift.shift_date)
    const status = getStatus(shift.start_time, shift.end_time)

    return (
      shift.shift_date.toLowerCase().includes(searchQuery.value.toLowerCase())
      || dayName.toLowerCase().includes(searchQuery.value.toLowerCase())
      || shift.shift.toLowerCase().includes(searchQuery.value.toLowerCase())
      || shift.start_time?.toLowerCase().includes(searchQuery.value.toLowerCase())
      || shift.end_time?.toLowerCase().includes(searchQuery.value.toLowerCase())
      || status.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })
})

onMounted(() => {
  fetchShiftData()
})
</script>

<template>
  <VCard class="project-list">
    <!-- Custom Header -->
    <div class="text-h5 mb-4">
      List Aplikasi untuk Dosen
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
      :headers="headersShift"
      :items="filteredShifts"
      :loading="loading"
      loading-text="Memuat data..."
    >
      <!-- Tanggal -->
      <template #item.shift_date="{ item }">
        {{ item.shift_date }}
      </template>

      <!-- Nama Hari -->
      <template #item.day_name="{ item }">
        <VChip
          :color="resolveDayColor(getDayName(item.shift_date))"
          :class="`text-${resolveDayColor(getDayName(item.shift_date))}`"
          size="small"
          class="font-weight-medium"
        >
          {{ getDayName(item.shift_date) }}
        </VChip>
      </template>

      <!-- Jadwal Shift -->
      <template #item.shift_schedule="{ item }">
        {{ `${getHour(item.shift_start)} - ${getHour(item.shift_end)}` }}
      </template>

      <!-- Mulai Aktual -->
      <template #item.start_time="{ item }">
        {{ getHour(item.start_time) }}
      </template>

      <!-- Selesai Aktual -->
      <template #item.end_time="{ item }">
        {{ getHour(item.end_time) }}
      </template>

      <!-- Status -->
      <template #item.status="{ item }">
        <VChip
          :color="resolveStatusColor(getStatus(item.start_time, item.end_time))"
          :class="`text-${resolveStatusColor(getStatus(item.start_time, item.end_time))}`"
          size="small"
          class="font-weight-medium"
        >
          {{ getStatus(item.start_time, item.end_time) }}
        </VChip>
      </template>
    </VDataTable>
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
              background-color: #f5f5f5;
              border-block-end: 2px solid #ddd;
              color: #2c2c2c;
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
                  color: #4a4a4a;
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
