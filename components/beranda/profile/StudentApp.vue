<script setup lang="ts">
import useApplications from '@/composables/useApplications'

const { applications: apiApplications } = useApplications()

// Project Table Header
const applicationTableHeaders = [
  { title: 'UI App', key: 'application' },
  { title: 'Link', key: 'link' },
]

const viewMode = ref('grid') // Set default to 'grid'

const itemsPerPage = ref(8) // Default rows per page
const page = ref(1) // Default page number

const applications = computed(() => apiApplications.value ?? [])

const sortedApplications = computed(() =>
  [...(applications.value || [])].sort((a, b) =>
    a.nameShort.localeCompare(b.nameShort, undefined, { sensitivity: 'base' }),
  ),
)

// Search query state
const searchQuery = ref('')

const selectedFaculty = ref('UI')

const uniqueFaculties = computed(() =>
  [...new Set((sortedApplications.value || []).map(app => app.faculty))].filter(
    faculty => faculty !== 'UI',
  ),
)

const faculties = computed(() => [
  'All',
  'UI',
  ...uniqueFaculties.value
    .filter(f => f !== 'UI')
    .sort((a, b) => a.localeCompare(b)),
])

// Filter aplikasi berdasarkan pencarian
const filteredApplications = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const facultyFilter = selectedFaculty.value

  return (sortedApplications.value || []).filter(app => {
    if (facultyFilter === 'All') {
      return [app.name, app.nameShort, app.link].some(field =>
        field.toLowerCase().includes(query),
      )
    }
    else {
      const matchesFaculty = app.faculty === facultyFilter

      const matchesSearch = [app.name, app.nameShort, app.link].some(field =>
        field.toLowerCase().includes(query),
      )

      return matchesFaculty && matchesSearch
    }
  })
})

const paginatedApplications = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value

  return filteredApplications.value.slice(start, start + itemsPerPage.value)
})
</script>

<template>
  <VCard class="project-list">
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h5">
        Aplikasi untuk Mahasiswa
      </div>
      <div class="d-flex gap-2">
        <VBtn
          icon
          variant="text"
          :color="viewMode === 'grid' ? 'primary' : 'default'"
          @click="viewMode = 'grid'"
        >
          <VIcon icon="ri-layout-grid-line" />
        </VBtn>
        <VBtn
          icon
          variant="text"
          :color="viewMode === 'horizontal' ? 'primary' : 'default'"
          @click="viewMode = 'horizontal'"
        >
          <VIcon icon="ri-layout-horizontal-line" />
        </VBtn>
      </div>
    </div>

    <div
      class="search-filter-container mb-4"
      style="
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
"
    >
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
        style="flex: 2;"
        @click:clear="searchQuery = ''"
      />

      <VSelect
        v-model="selectedFaculty"
        :items="faculties"
        label="Fakultas"
        dense
        outlined
        style="flex: 1;"
      />
    </div>

    <VRow
      v-if="viewMode === 'grid'"
      class="app-grid"
    >
      <VCol
        v-for="app in paginatedApplications"
        :key="app.name"
        cols="12"
        sm="6"
        md="3"
      >
        <VTooltip location="top">
          <template #activator="{ props }">
            <VCard
              class="app-card"
              v-bind="props"
              :href="app.link"
              target="_blank"
              rel="noopener"
            >
              <!-- Row with image and link -->
              <div class="app-header">
                <img
                  :src="
                    app.logo
                      ? app.logo
                      : `http://www.google.com/s2/favicons?sz=64&domain=${app.link}`
                  "
                  alt="favicon"
                  class="favicon-img"
                >

                <div class="link-wrapper">
                  <a
                    :href="app.link"
                    target="_blank"
                    class="app-link"
                  >
                    {{ app.link }} &gt;
                  </a>
                  <div class="fade-overlay" />
                </div>
              </div>

              <!-- The rest of the content -->
              <VCardText class="app-text">
                <div class="app-short">
                  {{ app.nameShort }}
                </div>
                <div class="app-name">
                  {{ app.name }}
                </div>
              </VCardText>
            </VCard>
          </template>

          <div>
            <div class="tooltip-text">
              <em class="app-link">{{ app.link }}</em><br>
              <strong>{{ app.nameShort }}</strong><br>
              {{ app.name }}<br>
            </div>
          </div>
        </VTooltip>
      </VCol>
    </VRow>

    <!-- SECTION Datatable -->
    <VDataTable
      v-if="viewMode === 'horizontal'"
      :headers="applicationTableHeaders"
      :items="paginatedApplications"
      :items-per-page="itemsPerPage"
      hide-default-footer
      fixed-header
      item-value="name"
    >
      <!-- application -->
      <template #item.application="{ item }">
        <div class="d-flex align-center gap-x-3">
          <img
            :src="
              item.logo
                ? item.logo
                : `http://www.google.com/s2/favicons?sz=64&domain=${item.link}`
            "
            alt="favicon"
            class="favicon-img"
          >

          <div>
            <h6 class="text-h6 text-no-wrap">
              {{ item.nameShort }}
            </h6>
            <div class="text-body-2">
              {{ item.name }}
            </div>
          </div>
        </div>
      </template>

      <!-- link -->
      <template #item.link="{ item }">
        <div class="d-flex align-center gap-3">
          <div class="text-high-emphasis">
            <a
              :href="item.link"
              target="_blank"
              rel="noopener"
            >{{
              item.link
            }}</a>
          </div>
        </div>
      </template>

      <!-- TODO Refactor this after vuetify provides proper solution for removing default footer -->
      <template #bottom />
    </VDataTable>
    <!-- !SECTION -->
    <div class="pagination-container pt-4">
      <div class="d-flex flex-wrap align-center justify-space-between gap-4">
        <VSelect
          v-model="itemsPerPage"
          :items="[4, 8, 16, 32]"
          label="Rows per page:"
          variant="underlined"
          density="comfortable"
          style="max-inline-size: 10rem;"
        />

        <VPagination
          v-model="page"
          :total-visible="4"
          :length="Math.ceil(filteredApplications.length / itemsPerPage)"
        />
      </div>
    </div>
  </VCard>
</template>

<style lang="scss">
.projectList {
  .v-table {
    &--density-default {
      .v-table__wrapper {
        table {
          tbody {
            tr {
              td {
                block-size: 56px;
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
  margin-block-end: 20px;
}

.content-container {
  padding-block: 0 20px;
  padding-inline: 20px; /* No padding on top */
}

.app-card {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  block-size: 100%;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.app-card:hover {
  transform: scale(1.02);
}

.app-image {
  overflow: hidden;
  inline-size: 100%;
  max-block-size: 100px;
  object-fit: cover;
}

.app-text {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: space-between;
  padding-block: 8px;
  padding-inline: 12px;
}

.app-link {
  display: inline-block;
  overflow: hidden;
  color: color-mix(in srgb, rgb(var(--v-global-theme-primary)) 85%, black 15%);
  font-size: 14px;
  max-inline-size: 100%;
  padding-inline-end: 5px; /* extra space for the fade */
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fade-overlay {
  position: absolute;
  background:
    linear-gradient(
      to right,
      transparent,
      rgb(var(--v-theme-background))
    );
  block-size: 100%;
  inline-size: 40px;
  inset-block-start: 0;
  inset-inline-end: 0;
  pointer-events: none;
}

.link-wrapper {
  position: relative;
  overflow: hidden;
  flex: 1;
  max-inline-size: 100%;
}

.app-name {
  overflow: hidden;
  color: gray;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-card:hover .app-name {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.app-short {
  font-size: 16px;
  font-weight: bold;
  margin-block-start: 4px;
}

.app-header {
  display: flex;
  align-items: center;
  background-color: rgb(var(--v-theme-background));
  padding-block: 8px;
  padding-inline: 12px;
}

.favicon-img {
  border-radius: 6px;

  // background-color: white;
  block-size: 16px;
  inline-size: 16px;
  margin-inline-end: 12px;
  object-fit: contain;
}

.search-filter-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-block-end: 1.5rem;

  // Responsive: stack vertically on small screens
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;

    .v-text-field,
    .v-select {
      inline-size: 100% !important;
      min-inline-size: 0 !important;
    }
  }
}

.pagination-container {
  margin-block-start: 1rem;

  .d-flex {
    flex-wrap: wrap;
    gap: 1rem;

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: stretch !important;
      gap: 0.5rem;

      .v-select,
      .v-pagination {
        justify-content: center;
        inline-size: 100% !important;
        min-inline-size: 0 !important;
      }
    }
  }
}

.project-list {
  padding: 20px;

  @media (max-width: 600px) {
    padding-block: 10px;
    padding-inline: 4px;
  }
}
</style>
