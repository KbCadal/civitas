<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'

const keycloakStore = useKeycloakStore()
const vuetifyTheme = useTheme()

// Convert a hex color to HSL { h, s, l } with h in [0,360], s/l in [0,100]
function hexToHsl(hex) {
  if (!hex)
    return { h: 0, s: 0, l: 50 }
  const cleaned = hex.replace('#', '')
  const full = cleaned.length === 3 ? cleaned.split('').map(c => c + c).join('') : cleaned
  const num = Number.parseInt(full, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255

  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) * 60
        break
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) * 60
        break
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) * 60
        break
    }
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslString(h, s, l) {
  // use comma-format for widest browser support
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

// Create alternative hues but keep lightness similar to primary
const primaryHex = computed(() => vuetifyTheme.current.value.colors.primary || '')
const primaryHsl = computed(() => hexToHsl(String(primaryHex.value)))

// Helpers to map primary HSL -> schedule HSL with amplified brightness
function computeScheduleLight(primaryL: number | undefined) {
  // primaryL is in [0..100]
  const minLight = 58 // baseline minimum so schedule cards stay light
  const maxLight = 92 // upper bound for schedule lightness

  const p = (typeof primaryL === 'number' ? primaryL : 50) / 100

  // gamma < 1 makes the function rise faster for lighter primaries
  const gamma = 0.9
  const eased = Math.max(0, Math.min(1, p)) ** gamma

  return Math.round(Math.min(100, minLight + eased * (maxLight - minLight)))
}

function computeScheduleSat(primaryS: number | undefined) {
  // nudge saturation up slightly for more vivid schedule colors
  const base = typeof primaryS === 'number' ? primaryS : 60
  const clamped = Math.max(40, Math.min(85, base))

  // small boost for intensity; clamp to 100
  return Math.min(100, Math.round(clamped + 8))
}

// pick hues for the three schedule colors (you can tweak these)
// Use computed helpers so brightness changes are amplified (more noticeable)
const colorRed = computed(() => {
  const hue = 210 // blue
  const sat = computeScheduleSat(primaryHsl.value.s)
  const light = computeScheduleLight(primaryHsl.value.l)

  return hslString(hue, sat, light)
})

const colorBlue = computed(() => {
  const hue = 160 // teal
  const sat = computeScheduleSat(primaryHsl.value.s)
  const light = computeScheduleLight(primaryHsl.value.l)

  return hslString(hue, sat, light)
})

const colorGreen = computed(() => {
  const hue = 30 // orange/yellow
  const sat = computeScheduleSat(primaryHsl.value.s)
  const light = computeScheduleLight(primaryHsl.value.l)

  return hslString(hue, sat, light)
})

const scheduleCssVars = computed(() => ({
  '--schedule-color-red': colorRed.value,
  '--schedule-color-blue': colorBlue.value,
  '--schedule-color-green': colorGreen.value,
}))

const schedule = ref<any[]>([])
const loading = ref(false)
const viewMode = ref<'vertical' | 'horizontal'>('vertical') // ← track the mode

const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
const startHour = 7
const endHour = 21
const currentTime = ref(new Date())

// Function to check if the current time is within a schedule item range

const { api } = useCivitasApi()

async function getData() {
  loading.value = true
  schedule.value = []

  try {
    const { response, error } = await api.user.getRiwayatAkademik()
    const data = Array.isArray(response.value) ? response.value : response.value?.value

    if (!data || !Array.isArray(data)) {
      loading.value = false

      return
    }

    if (keycloakStore.civitas === 'mahasiswa') {
      // 1. Filter out 'Kosong' semesters
      const filtered = data.filter(item => item.STATUS !== 'Kosong')

      if (filtered.length === 0) {
        schedule.value = []
        loading.value = false

        return
      }

      // 2. Sort by year, semester, term (descending)
      filtered.sort((a, b) => {
        if (b.THN !== a.THN)
          return Number(b.THN) - Number(a.THN)
        if (b.SEMESTER !== a.SEMESTER)
          return Number(b.SEMESTER) - Number(a.SEMESTER)

        return Number(b.TERM) - Number(a.TERM)
      })

      // 3. Take the latest semester
      const latestSemesterData = filtered[0]

      // 4. Map schedule for mahasiswa
      schedule.value = Object.values(latestSemesterData.IRS || {}).flatMap(course =>
        Object.values(course.JADWAL || {}).map(jadwal => ({
          day: jadwal.NM_HARI,
          start: jadwal.JAM_MULAI,
          end: jadwal.JAM_SELESAI,
          course: course.NM_KLS_MK,
          lecturer: course.PENGAJAR ? Object.values(course.PENGAJAR).join(', ') : '',
          room: jadwal.NM_RUANG,
          building: jadwal.NM_GED,
          tgl_mulai: jadwal.TGL_MULAI,
          tgl_selesai: jadwal.TGL_SELESAI,
        })),
      )
    }
    else if (keycloakStore.civitas === 'dosen') {
      // Map schedule for dosen
      schedule.value = data.map(item => ({
        day: item.NM_HARI,
        start: item.JAM_MULAI,
        end: item.JAM_SELESAI,
        course: item.NM_KLS_MK,
        lecturer: item.NAMA_DOSEN,
        room: item.NM_RUANG,
        building: item.NM_GED,
        tgl_mulai: item.TGL_MULAI,
        tgl_selesai: item.TGL_SELESAI,
      }))
    }
    else if (keycloakStore.civitas === 'staf') {
      schedule.value = []
    }
  }
  catch (err) {
    console.error('Failed to fetch schedule:', err.message)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  keycloakStore.refresh()
  getData()
})

function parseTime(time: string) {
  const formattedTime = time.replace('.', ':')
  const [hour, minute] = formattedTime.split(':').map(Number)

  if (isNaN(hour) || isNaN(minute)) {
    console.error(`Invalid time format: ${time}`)

    return Number.NaN
  }

  return (hour - startHour) * 60 + minute
}

function calculateRowSpan(start: string, end: string) {
  return parseTime(end) - parseTime(start)
}

// Group schedule by day
function getScheduleByDay(day: string) {
  return schedule.value.filter(item => item.day === day)
}

// Get alternating color classes
function getColorClass(index: number) {
  const colors = ['red', 'blue', 'green']

  return `schedule-color-${colors[index % 3]}`
}
</script>

<template>
  <VCard
    class="timetable-card"
    :style="scheduleCssVars"
  >
    <template #title>
      <div class="d-flex align-center header-container">
        <!-- Title -->
        <span class="text-h5 me-auto">Jadwal Kuliah</span>

        <!-- Date Range Box (desktop version) -->
        <div class="me-auto date-range-box">
          <span v-if="schedule.length > 0">
            {{ schedule[0].tgl_mulai }} / {{ schedule[0].tgl_selesai }}
          </span>
        </div>

        <!-- Icons -->
        <div class="d-flex gap-2">
          <VBtn
            icon
            variant="text"
            :color="viewMode === 'vertical' ? 'primary' : 'default'"
            @click="viewMode = 'vertical'"
          >
            <VIcon icon="ri-layout-vertical-line" />
          </VBtn>
          <VBtn
            icon
            variant="text"
            :color="viewMode === 'horizontal' ? 'primary' : 'default'"
            @click="viewMode = 'horizontal'"
          >
            <VIcon icon="ri-layout-horizontal-line" />
          </VBtn>
          <!--
            <VBtn
            icon
            variant="text"
            color="black"
            title="Download horizontal schedule as image"
            @click="downloadHorizontalSchedule"
            >
            <VIcon icon="ri-download-2-line" />
            </VBtn>
          -->
        </div>
      </div>

      <!-- Date Range Box (mobile version) -->
      <div class="date-range-box2">
        <span v-if="schedule.length > 0">
          {{ schedule[0].tgl_mulai }} / {{ schedule[0].tgl_selesai }}
        </span>
      </div>
    </template>

    <VCard
      v-if="viewMode === 'vertical'"
      class="timetable"
    >
      <!-- Header Row -->
      <div class="scrollable">
        <div class="grid-header">
          <div class="time-label">
            Jam
          </div>
          <div
            v-for="day in daysOfWeek"
            :key="day"
            class="day-header"
          >
            {{ day }}
          </div>
        </div>

        <!-- Grid Body -->
        <div class="grid-body">
          <!-- Time Labels -->
          <div class="time-column">
            <div
              v-for="hour in Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)"
              :key="hour"
              class="time-slot"
              :style="{
                gridRowStart: (hour - startHour) * 60 + 1, // Now each row is a single minute
                gridRowEnd: `span 60`, // Each hour label spans 60 rows
                gridColumn: 1, // Stays in the first column
              }"
            >
              {{ hour }}:00
            </div>
          </div>

          <!-- Schedule Grid -->
          <div class="schedule-grid">
            <div
              v-for="item in schedule"
              :key="item.course + item.start"
              class="schedule-item"
              :style="{
                gridRowStart: parseTime(item.start) + 1, // Ensure it starts correctly
                gridRowEnd: `span ${calculateRowSpan(item.start, item.end)}`,
                gridColumn: daysOfWeek.indexOf(item.day) + 1, //its already right because monday starts at 0 so time column +1
              }"
            >
              <div class="course-header">
                <span class="time">
                  <i class="ri-time-line" /> {{ item.start }} - {{ item.end }}
                </span>
                <span class="room">{{ item.room }}</span>
              </div>
              <div class="course-title">
                <span
                  v-if="item.course.includes('-')"
                  class="course-prefix"
                >
                  {{ item.course.split(' - ')[0] }}
                </span>
                <span class="course-name">
                  {{ item.course.includes('-') ? item.course.split(' - ')[1] : item.course }}
                </span>
              </div>
              <div class="building">
                {{ item.building }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </VCard>
    <VCard
      v-else
      class="timetable"
    >
      <div class="scrollable2">
        <table class="w-100 text-left table-schedule fixed-table">
          <thead>
            <tr>
              <th
                v-for="day in daysOfWeek"
                :key="day"
                class="px-2 py-2"
              >
                {{ day }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rowIndex in 10"
              :key="`row-${rowIndex}`"
            >
              <td
                v-for="(day, dayIndex) in daysOfWeek"
                :key="day + rowIndex"
                class="align-top px-2 py-3"
              >
                <div
                  v-if="getScheduleByDay(day)[rowIndex - 1]"
                  class="schedule-box"
                  :class="[getColorClass(rowIndex - 1)]"
                >
                  <div class="course-header mb-1">
                    <span class="text-sm">
                      <i class="ri-time-line" /> {{
                        getScheduleByDay(day)[rowIndex - 1].start
                      }} - {{
                        getScheduleByDay(day)[rowIndex - 1].end
                      }}
                    </span>
                    <span class="text-xs">{{ getScheduleByDay(day)[rowIndex - 1].room }}</span>
                  </div>
                  <div class="course-title2 font-semibold text-sm mb-1">
                    <span
                      v-if="getScheduleByDay(day)[rowIndex - 1].course.includes('-')"
                      style=" padding-inline-end: 4px;text-decoration: underline;"
                    >
                      {{ getScheduleByDay(day)[rowIndex - 1].course.split(' - ')[0] }}
                    </span>
                    <span class="course-name">
                      {{
                        getScheduleByDay(day)[rowIndex - 1].course.includes('-')
                          ? getScheduleByDay(day)[rowIndex - 1].course.split(' - ')[1]
                          : getScheduleByDay(day)[rowIndex - 1].course
                      }}
                    </span>
                  </div>
                  <div class="building text-xs">
                    {{ getScheduleByDay(day)[rowIndex - 1].building }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </VCard>
  </VCard>
</template>

<style scoped>
.scrollable {
  overflow: auto hidden; /* Optional: you can allow vertical scroll if needed */
  box-sizing: border-box;
  inline-size: 100%;
  min-inline-size: 500px;
}

/* Optional: make inner content grow past 700px if needed */
.scrollable > * {
  min-inline-size: 500px;
}

.scrollable2 {
  overflow: auto hidden; /* Optional: you can allow vertical scroll if needed */
  box-sizing: border-box;
  inline-size: 100%;
  min-inline-size: 1000px;
}

/* Optional: make inner content grow past 700px if needed */
.scrollable2 > * {
  min-inline-size: 1000px;
}

.date-range-box,
.date-range-box2 {
  border-radius: 5px;
  background-color: rgba(var(--v-global-theme-primary), 0.1);
  font-size: 14px;
  font-weight: bold;
  padding-block: 5px;
  padding-inline: 10px;
}

/* Default: show inline box, hide full-width box */
.date-range-box {
  display: inline-block;
  margin-inline-start: 10px;
}

.date-range-box2 {
  display: none;
}

/* Wrapped layout or small screens */
@media (max-width: 600px) {
  .date-range-box {
    display: none;
  }

  .date-range-box2 {
    display: flex;
    justify-content: center;
    inline-size: 100%;
    margin-block-start: 8px;
  }
}

.timetable {
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  margin-block: 0;
  margin-block-end: 20px;
  margin-inline: 20px; /* Only applies margin to left and right */
  max-inline-size: calc(100% - 40px); /* Adjusts width accordingly */
  overflow-x: auto;
}

.grid-header {
  display: grid;
  background-color: rgba(var(--v-global-theme-primary));
  color: rgba(var(--v-theme-on-primary));
  font-weight: bold;
  grid-template-columns: 80px repeat(5, 1fr);
  padding-inline: 5px;
  text-align: center;
}

.time-label,
.day-header {
  padding: 10px;
  font-size: 14px;
  text-align: center;
}

.course-title {
  display: flex;
  flex-wrap: wrap; /* Allow wrapping when needed */
  border-block-end: 1px solid;
  font-size: 12px;
  font-weight: bold;
  gap: 4px;        /* Optional: space between prefix and name */
  inline-size: 100%;
  padding-block-end: 4px;
}

.course-title2 {
  display: flex;
  flex-wrap: wrap; /* Allow wrapping when needed */
  border-block-end: 1px solid;
  font-size: 12px;
  font-weight: bold;
  gap: 4px;        /* Optional: space between prefix and name */
  inline-size: 100%;
  padding-block-end: 4px;
}

.course-prefix {
  color: color-mix(in srgb, rgba(var(--v-global-theme-primary)) 70%, black 30%);
  text-decoration: underline;
}

.course-name {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  text-overflow: ellipsis;
}

.course-header {
  display: flex;
  justify-content: space-between;
  gap: 8px; /* optional spacing */
  inline-size: 100%;
}

.time {
  flex-shrink: 0; /* Don't shrink */
  font-weight: normal;
  text-align: start;
  white-space: nowrap;
}

.room {
  overflow: hidden;
  flex-grow: 1;
  flex-shrink: 1;
  font-weight: normal;
  text-align: end;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-body {
  display: grid;
  grid-template-columns: 80px auto; /* Time column + Schedule grid */
  padding-block: 30px;
  padding-inline: 5px;
}

.time-column {
  display: grid;
  font-weight: bold;
  grid-template-rows: repeat(840, 1px); /* Assuming 07:00 - 21:00, 30-min per row */
  text-align: center;
}

.time-slot {
  position: relative;
  display: flex;
  flex-direction: column; /* Stack content vertically */
  align-items: center; /* Center horizontally */
  justify-content: flex-start; /* Align content to the top */
  block-size: 60px; /* 30 min per row */
  margin-block-start: -15px;
  padding-block-start: 5px; /* Optional: Add some spacing from the top */
}

.schedule-item {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  align-items: flex-start; /* Keeps text left-aligned */
  justify-content: flex-start; /* Aligns content to the top */
  padding: 6px;
  border-radius: 6px;
  margin: 2px;
  background-color: color-mix(in srgb, rgba(var(--v-global-theme-primary)) 80%, white 20%);
  color: rgba(var(--v-theme-on-primary));
  font-size: 12px;
  outline: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  text-align: start; /* Ensures text is left-aligned */
}

.schedule-grid {
  position: relative;
  display: grid;
  flex: 1;
  background-image: repeating-linear-gradient(to bottom, #ccc 0, #ccc 1px, transparent 1px, transparent 60px);
  background-size: 100%; /* Ensures lines every 60px */
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(840, 1px); /* 1px per minute */
}

.building {
  font-weight: normal;
  opacity: 0.8;
  text-align: start; /* Aligns room to the right */
}

.building2 {
  font-weight: normal;
  opacity: 0.8;
  text-align: start; /* Aligns room to the right */
}

.fixed-table {
  border-collapse: collapse;
  inline-size: 100%;
  table-layout: fixed;
}

.fixed-table thead th {
  background-color: rgba(var(--v-global-theme-primary));
  color: rgba(var(--v-theme-on-primary));
  font-weight: bold;
  text-align: center;
}

.fixed-table th,
.fixed-table td {
  padding: 0;
  margin: 0;
}

.schedule-box {
  padding: 6px;
  border-radius: 8px;
  color: rgba(var(--v-theme-on-primary));
  font-size: 0.85rem;
  min-block-size: 90px;
}

/* Color themes for items */
.schedule-color-red {
  background-color: var(--schedule-color-red, #6aa1fa);
}

.schedule-color-blue {
  background-color: var(--schedule-color-blue, #46c298);
}

.schedule-color-green {
  background-color: var(--schedule-color-green, #eda36b);
}

@media screen and (max-width: 1200px) {
  .course-title {
    border-block-end: 0 solid;
  }

  .course-header {
    text-overflow: ellipsis; /* Adds "..." when text is too long */
    word-break: break-word; /* Allows text to wrap naturally */
  }

  .building,
  .time {
    display: none;
  }

  .room {
    text-align: start;
  }
}

@media screen and (max-width: 900px) {
  .course-title {
    border-block-end: 0 solid;
  }

  .room {
    text-align: start;
  }
}

@media screen and (max-width: 600px) {
  .room {
    display: none;
  }
}
</style>
