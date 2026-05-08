<script setup lang="ts">
import { computed, ref } from 'vue'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import { useAuthFetch } from '@/composables/useAuthFetch'

const keycloakStore = useKeycloakStore()

// fetch all apps (admin)
const { data, pending: _, error: __, refresh } = useAuthFetch('/api/admin/applications')

const studentApps = computed(() => data.value?.studentApplications ?? [])
const dosenApps = computed(() => data.value?.dosenApplications ?? [])
const stafApps = computed(() => data.value?.stafApplications ?? [])

// UI state: list presentation like TendikApp
const viewMode = ref('horizontal')
const itemsPerPage = ref(8)
const page = ref(1)

const searchQuery = ref('')
const selectedFaculty = ref('All')
const roleFilter = ref('All')

// Compose unified apps with role tag
const allApplications = computed(() => {
  const mapApps = (arr: any[], role: string) => arr.map((a, i) => ({ ...a, __role: role, __index: i }))

  return [
    ...mapApps(studentApps.value, 'mahasiswa'),
    ...mapApps(dosenApps.value, 'dosen'),
    ...mapApps(stafApps.value, 'staf'),
  ]
})

const sortedApplications = computed(() =>
  [...(allApplications.value || [])].sort((a, b) =>
    a.nameShort.localeCompare(b.nameShort, undefined, { sensitivity: 'base' }),
  ),
)

const uniqueFaculties = computed(() =>
  [...new Set((sortedApplications.value || []).map(app => app.faculty || ''))]
    .filter(Boolean),
)

const faculties = computed(() => ['All', 'UI', ...uniqueFaculties.value.sort((a, b) => a.localeCompare(b))])

const filteredApplications = computed(() => {
  const query = String(searchQuery.value || '').toLowerCase()
  const facultyFilter = selectedFaculty.value
  const roleF = roleFilter.value

  return (sortedApplications.value || []).filter((app: any) => {
    if (roleF !== 'All' && app.__role !== roleF)
      return false

    if (facultyFilter !== 'All' && (app.faculty || '') !== facultyFilter)
      return false

    if (!query)
      return true

    return [app.name, app.nameShort, app.link].some((field: string) => String(field || '').toLowerCase().includes(query))
  })
})

const paginatedApplications = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value

  return filteredApplications.value.slice(start, start + itemsPerPage.value)
})

// Modal & form state
const dialogAdd = ref(false)
const dialogEdit = ref(false)
const editTarget = ref<any>(null)
const dialogDelete = ref(false)
const deleteTarget = ref<any>(null)

const form = ref({ role: 'mahasiswa', name: '', nameShort: '', faculty: '', link: '', logo: '' })
const roleOptions = [{ title: 'Mahasiswa', value: 'mahasiswa' }, { title: 'Dosen', value: 'dosen' }, { title: 'Staf', value: 'staf' }]

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

async function openAddDialog() {
  form.value = { role: 'mahasiswa', name: '', nameShort: '', faculty: '', link: '', logo: '' }
  dialogAdd.value = true
}

async function openEditDialog(item: any) {
  editTarget.value = item
  form.value = { role: item.__role, name: item.name, nameShort: item.nameShort, faculty: item.faculty, link: item.link, logo: item.logo }
  dialogEdit.value = true
}

async function submitNewApp() {
  try {
    const application = { ...form.value }

    await $fetch('/api/admin/applications', {
      method: 'POST',
      body: { role: form.value.role, application },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Aplikasi berhasil ditambahkan'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogAdd.value = false
    refresh()
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal menambahkan aplikasi'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function submitEditApp() {
  try {
    if (!editTarget.value)
      throw new Error('Target edit tidak ditentukan')

    await $fetch('/api/admin/applications', {
      method: 'PUT',
      body: { role: editTarget.value.__role, index: editTarget.value.__index, application: form.value },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Aplikasi berhasil diperbarui'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogEdit.value = false
    editTarget.value = null
    refresh()
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal memperbarui aplikasi'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function deleteApp(item: any) {
  // open confirmation dialog instead of using native confirm()
  deleteTarget.value = item
  dialogDelete.value = true
}

async function performDeleteApp() {
  try {
    const item = deleteTarget.value
    if (!item)
      throw new Error('Target tidak ditentukan')

    await $fetch('/api/admin/applications', {
      method: 'DELETE',
      body: { role: item.__role, index: item.__index },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Aplikasi berhasil dihapus'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogDelete.value = false
    deleteTarget.value = null
    refresh()
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal menghapus aplikasi'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="12"
    >
      <VCard class="px-4">
        <VCardItem style="padding-inline: 0 !important;">
          <VCardTitle
            class="d-flex align-center gap-2"
            style="padding-inline: 0 !important;"
          >
            <span>Daftar Aplikasi</span>
            <VSpacer />
          </VCardTitle>
        </VCardItem>

        <VForm>
          <div class="search-filter-container mb-4 d-flex gap-3 align-center">
            <VTextField
              v-model="searchQuery"
              label="Search"
              placeholder="Search ..."
              append-inner-icon="ri-search-line"
              clearable
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
              style="inline-size: 12rem;"
            />
            <VSelect
              v-model="roleFilter"
              :items="['All', 'mahasiswa', 'dosen', 'staf']"
              label="Role"
              dense
              outlined
              style="inline-size: 10rem; text-transform: capitalize;"
            />
            <div>
              <VBtn
                color="primary"
                @click="openAddDialog"
              >
                Tambah Aplikasi Baru
              </VBtn>
            </div>
          </div>

          <div class="mb-4">
            <VRow
              v-if="viewMode === 'grid'"
              class="app-grid"
            >
              <VCol
                v-for="app in paginatedApplications"
                :key="app.name + app.__role"
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
                  <div class="app-header">
                    <img
                      :src="app.logo ? app.logo : `http://www.google.com/s2/favicons?sz=64&domain=${app.link}`"
                      alt="favicon"
                      class="favicon-img"
                    >
                    <div class="link-wrapper">
                      <a
                        :href="app.link"
                        target="_blank"
                        class="app-link"
                      >{{ app.link }} &gt;</a>
                      <div class="fade-overlay" />
                    </div>
                  </div>

                  <VCardText class="app-text">
                    <div class="d-flex justify-space-between align-center">
                      <div>
                        <div class="app-short">
                          {{ app.nameShort }}
                        </div>
                        <div class="app-name">
                          {{ app.name }}
                        </div>
                      </div>
                      <div class="d-flex flex-column gap-2">
                        <VBtn
                          size="small"
                          variant="tonal"
                          @click.stop.prevent="openEditDialog(app)"
                        >
                          Edit
                        </VBtn>
                        <VBtn
                          size="small"
                          variant="text"
                          color="error"
                          @click.stop.prevent="deleteApp(app)"
                        >
                          Delete
                        </VBtn>
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>

            <VDataTable
              v-else
              :headers="[{ title: 'Aplikasi', key: 'application' }, { title: 'Link', key: 'link' }, { title: 'Role', key: 'role' }, { title: 'Actions', key: 'actions' }]"
              :items="paginatedApplications"
              :items-per-page="itemsPerPage"
              hide-default-footer
              fixed-header
              item-value="name"
            >
              <template #item.application="{ item }">
                <div class="d-flex align-center gap-x-3">
                  <img
                    :src="item.logo ? item.logo : `http://www.google.com/s2/favicons?sz=64&domain=${item.link}`"
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

              <template #item.role="{ item }">
                <div style="text-transform: capitalize;">
                  {{ item.__role }}
                </div>
              </template>

              <template #item.actions="{ item }">
                <div class="d-flex gap-2">
                  <VBtn
                    size="small"
                    variant="tonal"
                    @click.stop.prevent="openEditDialog(item)"
                  >
                    Edit
                  </VBtn>
                  <VBtn
                    size="small"
                    variant="text"
                    color="error"
                    @click.stop.prevent="deleteApp(item)"
                  >
                    Delete
                  </VBtn>
                </div>
              </template>

              <template #bottom />
            </VDataTable>
          </div>

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
                :length="Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage))"
              />
            </div>
          </div>
        </VForm>
      </VCard>
    </VCol>

    <!-- Add / Edit Dialogs -->
    <VDialog
      v-model="dialogAdd"
      width="600"
    >
      <template #default>
        <VCard class="p-6">
          <VCardTitle>Tambah Aplikasi Baru</VCardTitle>
          <VCardText>
            <VForm>
              <VSelect
                v-model="form.role"
                :items="roleOptions"
                item-title="title"
                item-value="value"
                label="Role"
              />
              <VTextField
                v-model="form.name"
                label="Name"
                class="my-2"
              />
              <VTextField
                v-model="form.nameShort"
                label="Name Short"
                class="my-2"
              />
              <VTextField
                v-model="form.faculty"
                label="Faculty"
                class="my-2"
              />
              <VTextField
                v-model="form.link"
                label="Link"
                class="my-2"
              />
              <VTextField
                v-model="form.logo"
                label="Logo (public path)"
                class="my-2"
                placeholder="/images/..."
              />
            </VForm>
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              text
              @click="dialogAdd = false"
            >
              Batal
            </VBtn>
            <VBtn
              color="primary"
              @click="submitNewApp"
            >
              Tambah
            </VBtn>
          </VCardActions>
        </VCard>
      </template>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog
      v-model="dialogDelete"
      max-width="480"
    >
      <VCard>
        <VCardTitle class="text-h6 d-flex flex-column align-center justify-center pt-6 pb-2">
          <VIcon
            color="warning"
            size="36"
            class="mb-2"
          >
            ri-alert-line
          </VIcon>
          Konfirmasi Hapus
        </VCardTitle>
        <VCardText class="text-center py-4">
          <div class="mb-2">
            Yakin ingin menghapus aplikasi
            <div class="font-weight-bold">
              {{ deleteTarget?.name }}
            </div>
          </div>
        </VCardText>
        <VCardActions class="justify-end px-4 pb-4">
          <VBtn
            color="secondary"
            variant="text"
            @click="dialogDelete = false"
          >
            Batal
          </VBtn>
          <VBtn
            color="error"
            variant="elevated"
            @click="performDeleteApp"
          >
            Hapus
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog
      v-model="dialogEdit"
      width="600"
    >
      <template #default>
        <VCard>
          <VCardTitle>Edit Aplikasi</VCardTitle>
          <VCardText>
            <VForm>
              <VSelect
                v-model="form.role"
                :items="roleOptions"
                item-title="title"
                item-value="value"
                label="Role"
              />
              <VTextField
                v-model="form.name"
                label="Name"
                class="my-2"
              />
              <VTextField
                v-model="form.nameShort"
                label="Name Short"
                class="my-2"
              />
              <VTextField
                v-model="form.faculty"
                label="Faculty"
                class="my-2"
              />
              <VTextField
                v-model="form.link"
                label="Link"
                class="my-2"
              />
              <VTextField
                v-model="form.logo"
                label="Logo (public path)"
                class="my-2"
                placeholder="/images/..."
              />
            </VForm>
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              text
              @click="dialogEdit = false"
            >
              Batal
            </VBtn>
            <VBtn
              color="primary"
              @click="submitEditApp"
            >
              Simpan
            </VBtn>
          </VCardActions>
        </VCard>
      </template>
    </VDialog>

    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="4000"
      location="top"
    >
      {{ snackbarMessage }}
    </VSnackbar>
  </VRow>
</template>

<style scoped>
.my-4 { margin-block: 1rem; }

/* normalize heights for controls in the search/filter row */
.search-filter-container {
  align-items: center;
}

.search-filter-container ::v-deep(.v-field),
.search-filter-container ::v-deep(.v-text-field),
.search-filter-container ::v-deep(.v-select) {
  block-size: 40px;
  min-block-size: 40px;
}

.search-filter-container ::v-deep(.v-btn) {
  block-size: 40px;
  min-block-size: 40px;
  padding-block: 0;
}
</style>
