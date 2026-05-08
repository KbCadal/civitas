<script setup lang="ts">
import figma from '@images/icons/project-icons/figma.png'
import html5 from '@images/icons/project-icons/html5.png'
import python from '@images/icons/project-icons/python.png'
import react from '@images/icons/project-icons/react.png'
import sketch from '@images/icons/project-icons/sketch.png'
import vue from '@images/icons/project-icons/vue.png'
import xamarin from '@images/icons/project-icons/xamarin.png'

// Project Table Header
const applicationTableHeaders = [
  { title: 'UI App', key: 'application' },
  { title: 'Link', key: 'link' },
]

const viewMode = ref('grid') // Set default to 'grid'

const itemsPerPage = ref(8) // Default rows per page
const page = ref(1) // Default page number

const paginatedApplications = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value

  return filteredApplications.value.slice(start, start + itemsPerPage.value)
})

const applications = [
  {
    logo: react,
    name: 'Human Resource Information System Universitas Indonesia',
    nameShort: 'HRIS UI',
    link: 'https://hris.ui.ac.id/',
  },
  {
    logo: figma,
    name: 'Sistem Informasi Akademik NextGeneration',
    nameShort: 'SIAKNG',
    link: 'https://academic.ui.ac.id/',
  },
  {
    logo: figma,
    name: 'E-learning Management System',
    nameShort: 'EMAS-2',
    link: 'https://emas2.ui.ac.id/',
  },
  {
    logo: vue,
    name: 'Dashboard App',
    nameShort: 'Vuejs Project',
    link: '#',
  },
  {
    logo: xamarin,
    name: 'Foodista mobile app',
    nameShort: 'Xamarin Project',
    link: '#',
  },
  {
    logo: python,
    name: 'Dojo Email App',
    nameShort: 'Python Project',
    link: '#',
  },
  {
    logo: sketch,
    name: 'Blockchain App',
    nameShort: 'Sketch Project',
    link: '#',
  },
  {
    logo: html5,
    name: 'Hoffman App',
    nameShort: 'HTML Project',
    link: '#',
  },
]

// Search query state
const searchQuery = ref('')

// Filter aplikasi berdasarkan pencarian
const filteredApplications = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return applications.filter(app =>
    [app.name, app.nameShort, app.link].some(field =>
      field.toLowerCase().includes(query),
    ),
  )
})
</script>

<template>
  <VCard class="project-list">
    <!-- Custom Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h5">
        List Aplikasi untuk Mahasiswa
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

    <!-- Search Input -->
    <div class="search-container mb-4">
      <!-- <VTextField v-model="searchQuery" label="Search" clearable variant="outlined" density="comfortable" /> -->
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
        @click:clear="searchQuery = ''"
      />
    </div>

    <!-- Search Input -->

    <!-- Grid View -->
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
        <VCard
          class="app-card"
          :href="app.link"
          target="_blank"
          rel="noopener"
        >
          <VImg
            :src="app.logo"
            class="app-image"
          />
          <VCardText class="app-text">
            <a
              :href="app.link"
              target="_blank"
              class="app-link"
            >{{ app.link }} ></a>
            <div class="app-short">
              {{ app.nameShort }}
            </div>
            <div class="app-name">
              {{ app.name }}
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- SECTION Datatable -->
    <VDataTable
      v-if="viewMode === 'horizontal'"
      :headers="applicationTableHeaders"
      :items="paginatedApplications"
      hide-default-footer
      fixed-header
      item-value="name"
    >
      <!-- application -->
      <template #item.application="{ item }">
        <div class="d-flex align-center gap-x-3">
          <VAvatar
            :size="34"
            :image="item.logo"
          />
          <div>
            <h6 class="text-h6 text-no-wrap">
              {{ item.name }}
            </h6>
            <div class="text-body-2">
              {{ item.nameShort }}
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
            >{{ item.link }}</a>
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
          :total-visible="5"
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
}

.content-container {
  padding-block: 0 20px;
  padding-inline: 20px; /* No padding on top */
}

.project-list {
  padding: 20px;
}

.search-container {
  display: flex;
  justify-content: flex-end;
  margin-block-end: 20px;
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
  display: block;
  color: rgb(var(--v-global-theme-primary));
  font-size: 14px;
  text-decoration: none;
}

.app-name {
  overflow: hidden;
  color: gray;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-card:hover .app-name {
  overflow: visible;
  text-overflow: unset;
  white-space: normal;
}

.app-short {
  font-size: 16px;
  font-weight: bold;
  margin-block-start: 4px;
}
</style>
