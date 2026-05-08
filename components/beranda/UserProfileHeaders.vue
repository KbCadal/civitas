<script setup lang="ts">
import { computed, ref } from 'vue'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import { useAuthFetch } from '@/composables/useAuthFetch'

const keycloakStore = useKeycloakStore()

// Admin-only fetch of profile headers
const { data, refresh } = useAuthFetch('/api/admin/profile-headers')

const items = computed(() => data.value?.profileHeaders || [])

const selectedId = ref<string | null>(null)
const selectedItem = computed(() => items.value.find((i: any) => i.id === selectedId.value) || null)

// selection and role options (roles will be chosen inside the Tampilkan modal)
const selectedRoles = ref<Array<string>>([])
const roleOptions = [{ title: 'Mahasiswa', value: 'mahasiswa' }, { title: 'Dosen', value: 'dosen' }, { title: 'Staf', value: 'staf' }]

// search & filter
const searchQuery = ref('')
const filterPriority = ref('')

const filteredItems = computed(() => {
  const q = String(searchQuery.value || '').toLowerCase().trim()

  return items.value.filter((item: any) => {
    if (filterPriority.value && String(item.priority || 'current') !== String(filterPriority.value))
      return false

    if (!q)
      return true

    return String(item.title || '').toLowerCase().includes(q)
  })
})

// Priority and date fields (used in the Tampilkan modal)
// priority: 'current' | 'birthday' | 'date'
const formPriorityOptions = [
  { title: 'Umum / Current', value: 'current' },
  { title: 'Birthday', value: 'birthday' },
  { title: 'Specific date', value: 'date' },
]

const formDateModes = [
  { title: 'Every year (MM-DD)', value: 'yearly' },
  { title: 'Every month (DD)', value: 'monthly' },
  { title: 'Every day', value: 'daily' },
  { title: 'Only once (YYYY-MM-DD)', value: 'once' },
]

// Dialogs and form
const dialogAdd = ref(false)
const dialogEdit = ref(false)
const dialogDelete = ref(false)
const deleteTarget = ref<any>(null)

const form = ref({ title: '', lightPath: '', darkPath: '' })

// Tampilkan modal state (for role assignment + priority/configuration)
const dialogTampilkan = ref(false)
const modalSelectedRoles = ref<Array<string>>([])
const modalPriority = ref<string>('current')
const modalDate = ref({ mode: 'yearly', value: '' })
const modalReplacements = ref<any[]>([])

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

async function openAdd() {
  form.value = { title: '', lightPath: '', darkPath: '' }
  dialogAdd.value = true
}

function openEdit(item: any) {
  form.value = { title: item.title || '', lightPath: item.lightPath || '', darkPath: item.darkPath || '' }
  dialogEdit.value = true
  selectedId.value = item.id
}

function confirmDelete(item: any) {
  deleteTarget.value = item
  dialogDelete.value = true
}

async function submitNew() {
  try {
    await $fetch('/api/admin/profile-headers', {
      method: 'POST',
      body: { title: form.value.title, lightPath: form.value.lightPath, darkPath: form.value.darkPath },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Header berhasil ditambahkan'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogAdd.value = false
    refresh()
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal menambahkan header'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function submitEdit() {
  try {
    if (!selectedId.value)
      throw new Error('Tidak ada target untuk diupdate')

    await $fetch('/api/admin/profile-headers', {
      method: 'PUT',
      body: { id: selectedId.value, title: form.value.title, lightPath: form.value.lightPath, darkPath: form.value.darkPath },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Header berhasil diperbarui'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogEdit.value = false
    refresh()
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal memperbarui header'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function performDelete() {
  try {
    const item = deleteTarget.value
    if (!item)
      throw new Error('Target tidak ditentukan')

    await $fetch('/api/admin/profile-headers', {
      method: 'DELETE',
      body: { id: item.id },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Header berhasil dihapus'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogDelete.value = false
    deleteTarget.value = null
    refresh()
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal menghapus header'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

function toggleSelect(item: any) {
  if (selectedId.value === item.id)
    selectedId.value = null
  else
    selectedId.value = item.id

  // selection visual only; roles and priority will be configured in the Tampilkan modal
}

// Open the Tampilkan modal where admin chooses roles + priority
function openTampilkan() {
  if (!selectedId.value) {
    snackbarMessage.value = 'Pilih header terlebih dahulu'
    snackbarColor.value = 'warning'
    snackbar.value = true

    return
  }

  const item = selectedItem.value

  modalSelectedRoles.value = (item?.assignedRoles || []).slice()
  modalPriority.value = String(item?.priority || 'current')
  modalDate.value = item?.date ? { ...(item.date || {}) } : { mode: 'yearly', value: '' }
  modalReplacements.value = []
  dialogTampilkan.value = true
}

// Preview replacements (call assign API without confirm, passing desired priority/date)
async function previewAssign() {
  try {
    const res: any = await $fetch('/api/admin/profile-headers/assign', {
      method: 'POST',
      body: { id: selectedId.value, roles: modalSelectedRoles.value, priority: modalPriority.value, date: modalDate.value },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    if (res?.confirmRequired) {
      modalReplacements.value = res.replacements || []

      return
    }

    // No replacements required, just finalize by confirming
    await $fetch('/api/admin/profile-headers/assign', {
      method: 'POST',
      body: { id: selectedId.value, roles: modalSelectedRoles.value, priority: modalPriority.value, date: modalDate.value, confirm: true },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    dialogTampilkan.value = false
    snackbarMessage.value = 'Header berhasil ditampilkan untuk role yang dipilih'
    snackbarColor.value = 'success'
    snackbar.value = true
    refresh()
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal melakukan preview tampilan'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function confirmAssignFromModal() {
  try {
    await $fetch('/api/admin/profile-headers/assign', {
      method: 'POST',
      body: { id: selectedId.value, roles: modalSelectedRoles.value, priority: modalPriority.value, date: modalDate.value, confirm: true },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    dialogTampilkan.value = false
    modalReplacements.value = []
    snackbarMessage.value = 'Header berhasil ditampilkan dan menggantikan header sebelumnya'
    snackbarColor.value = 'success'
    snackbar.value = true
    refresh()
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal melakukan tampilan'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function clearAndUnassignProfileHeader() {
  try {
    if (!selectedId.value)
      throw new Error('Tidak ada header yang dipilih')

    await $fetch('/api/admin/profile-headers/assign', {
      method: 'POST',
      body: { id: selectedId.value, roles: [], priority: modalPriority.value, date: modalDate.value, confirm: true },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    // Clear modal inputs
    modalSelectedRoles.value = []
    modalPriority.value = 'current'
    modalDate.value = { mode: 'yearly', value: '' }
    modalReplacements.value = []

    dialogTampilkan.value = false
    snackbarMessage.value = 'Penempatan otomatis dihapus untuk header ini'
    snackbarColor.value = 'success'
    snackbar.value = true

    refresh()
    try { window.dispatchEvent(new CustomEvent('admin:profileheaders:changed')) }
    catch (e) {}
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal menghapus penempatan otomatis'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle class="d-flex align-center gap-2 mb-4">
            <span>Profile Header Gallery</span>
            <VSpacer />
          </VCardTitle>

          <VCardText
            class="p-0"
            style="padding: 0 !important;"
          >
            <div class="d-flex gap-3 align-center flex-wrap controls-row">
              <VTextField
                v-model="searchQuery"
                class="search-field"
                placeholder="Cari nama gambar header"
                dense
                hide-details
                clearable
              />
              <VSelect
                v-model="filterPriority"
                :items="[{ title: 'Semua', value: '' }, { title: 'Umum', value: 'current' }, { title: 'Ulang Tahun', value: 'birthday' }, { title: 'Specific Date', value: 'date' }]"
                item-title="title"
                item-value="value"
                label="Filter"
                dense
              />
              <VBtn
                color="primary"
                :disabled="!selectedId"
                @click="openTampilkan"
              >
                Tampilkan
              </VBtn>
              <VBtn
                color="primary"
                @click="openAdd"
              >
                Tambah Header
              </VBtn>
            </div>
          </VCardText>
        </VCardItem>

        <VCardText>
          <VRow>
            <VCol
              v-for="item in filteredItems"
              :key="item.id"
              cols="12"
            >
              <VCard
                class="p-6 pa-6 border-default"
                outlined
                :elevation="selectedId === item.id ? 12 : 2"
                :class="{ 'selected-card': selectedId === item.id }"
                style="cursor: pointer;"
                @click="toggleSelect(item)"
              >
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <div class="text-caption mb-1">
                      Preview (Light)
                    </div>
                    <VImg
                      :src="item.lightPath || item.darkPath"
                      height="240"
                      cover
                      class="rounded-lg"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <div class="text-caption mb-1">
                      Preview (Dark)
                    </div>
                    <VImg
                      :src="item.darkPath || item.lightPath"
                      height="240"
                      cover
                      class="rounded-lg"
                    />
                  </VCol>
                </VRow>

                <VCardText
                  class="d-flex justify-space-between align-center mt-3 p-0"
                  style="padding: 0 !important;"
                >
                  <div>
                    <div class="font-weight-medium">
                      {{ item.title }}
                    </div>
                    <div class="d-flex gap-2 mt-1">
                      <VChip
                        v-if="(item.priority || 'current') === 'current'"
                        small
                      >
                        Umum
                      </VChip>
                      <VChip
                        v-else-if="item.priority === 'birthday'"
                        small
                        color="primary"
                      >
                        Ulang Tahun
                      </VChip>
                      <VChip
                        v-else-if="item.priority === 'date'"
                        small
                      >
                        {{ (item.date && item.date.mode) ? (item.date.mode === 'yearly' ? item.date.value : (item.date.mode === 'monthly' ? (`Hari ${item.date.value}`) : (item.date.mode === 'daily' ? 'Every day' : item.date.value))) : 'Tanggal' }}
                      </VChip>
                    </div>
                  </div>
                  <div class="d-flex flex-column gap-2">
                    <div v-if="(item.assignedRoles || []).length">
                      <VChip
                        v-for="r in item.assignedRoles"
                        :key="r"
                        small
                      >
                        {{ r }}
                      </VChip>
                    </div>
                    <div class="d-flex gap-2">
                      <VBtn
                        size="small"
                        variant="tonal"
                        @click.stop.prevent="openEdit(item)"
                      >
                        Edit
                      </VBtn>
                      <VBtn
                        size="small"
                        variant="text"
                        color="error"
                        @click.stop.prevent="confirmDelete(item)"
                      >
                        Delete
                      </VBtn>
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Add Dialog -->
    <VDialog
      v-model="dialogAdd"
      width="600"
      class="p-6"
    >
      <template #default>
        <VCard class="pa-6">
          <VCardTitle>Tambah Profile Header</VCardTitle>
          <VCardText>
            <VForm>
              <VTextField
                v-model="form.title"
                label="Title"
                class="mb-4"
              />
              <VTextField
                v-model="form.lightPath"
                label="Light Image URL"
                placeholder="https://..."
                class="mb-4"
              />
              <VTextField
                v-model="form.darkPath"
                label="Dark Image URL"
                placeholder="https://..."
                class="mb-4"
              />

              <div class="preview-row mt-4">
                <div class="text-caption mb-1">
                  Preview (Light)
                </div>
                <VImg
                  :src="form.lightPath || form.darkPath || ''"
                  height="200"
                  cover
                  class="rounded-lg"
                />
              </div>
              <div class="preview-row mt-3">
                <div class="text-caption mb-1">
                  Preview (Dark)
                </div>
                <VImg
                  :src="form.darkPath || form.lightPath || ''"
                  height="200"
                  cover
                  class="rounded-lg"
                />
              </div>
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
              @click="submitNew"
            >
              Simpan
            </VBtn>
          </VCardActions>
        </VCard>
      </template>
    </VDialog>

    <!-- Edit Dialog -->
    <VDialog
      v-model="dialogEdit"
      width="600"
      class="p-6"
    >
      <template #default>
        <VCard class="pa-6">
          <VCardTitle>Edit Profile Header</VCardTitle>
          <VCardText>
            <VForm>
              <VTextField
                v-model="form.title"
                label="Title"
                class="mb-4"
              />
              <VTextField
                v-model="form.lightPath"
                label="Light Image URL"
                placeholder="https://..."
                class="mb-4"
              />
              <VTextField
                v-model="form.darkPath"
                label="Dark Image URL"
                placeholder="https://..."
                class="mb-4"
              />

              <div class="preview-row mt-4">
                <div class="text-caption mb-1">
                  Preview (Light)
                </div>
                <VImg
                  :src="form.lightPath || form.darkPath || ''"
                  height="200"
                  cover
                  class="rounded-lg"
                />
              </div>
              <div class="preview-row mt-3">
                <div class="text-caption mb-1">
                  Preview (Dark)
                </div>
                <VImg
                  :src="form.darkPath || form.lightPath || ''"
                  height="200"
                  cover
                  class="rounded-lg"
                />
              </div>
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
              @click="submitEdit"
            >
              Simpan
            </VBtn>
          </VCardActions>
        </VCard>
      </template>
    </VDialog>

    <!-- Delete Confirmation -->
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
            Yakin ingin menghapus header <div class="font-weight-bold">
              {{ deleteTarget?.title }}
            </div>
          </div>
          <div class="mt-3">
            <VImg
              :src="deleteTarget?.lightPath || deleteTarget?.darkPath"
              height="120"
              cover
              class="rounded-lg mx-auto"
            />
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
            @click="performDelete"
          >
            Hapus
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Tampilkan modal: choose roles and priority, preview replacements, then confirm -->
    <VDialog
      v-model="dialogTampilkan"
      class="pa-6"
      max-width="900"
    >
      <VCard class="pa-6">
        <VCardTitle class="mb-4">
          Tampilkan Header
        </VCardTitle>
        <VCardText>
          <VForm>
            <VSelect
              v-model="modalSelectedRoles"
              :items="roleOptions"
              item-title="title"
              item-value="value"
              label="Pilih Role (boleh lebih dari satu)"
              multiple
              dense
              class="mb-4"
            />
            <VSelect
              v-model="modalPriority"
              :items="formPriorityOptions"
              item-title="title"
              item-value="value"
              label="Priority"
              dense
              class="mb-4"
            />

            <div
              v-if="modalPriority === 'date'"
              class="mt-3 mb-4"
            >
              <VSelect
                v-model="modalDate.mode"
                :items="formDateModes"
                item-title="title"
                item-value="value"
                label="Recurrence"
                dense
              />
              <VTextField
                v-if="modalDate.mode === 'once'"
                v-model="modalDate.value"
                type="date"
                label="Tanggal (YYYY-MM-DD)"
              />
              <VTextField
                v-else
                v-model="modalDate.value"
                label="Nilai tanggal (MM-DD or DD)"
                placeholder="MM-DD or DD"
              />
            </div>

            <div class="mt-4">
              <VBtn
                color="secondary"
                @click="previewAssign"
              >
                Preview Replacements
              </VBtn>
            </div>
          </VForm>

          <div
            v-if="modalReplacements.length"
            class="mt-4"
          >
            <div class="mb-2">
              Header yang akan digantikan:
            </div>
            <VRow>
              <VCol
                v-for="rep in modalReplacements"
                :key="rep.id"
                cols="12"
              >
                <VCard
                  class="pa-2"
                  outlined
                >
                  <VRow>
                    <VCol cols="3">
                      <VImg
                        :src="rep.lightPath || rep.darkPath"
                        height="80"
                        cover
                      />
                    </VCol>
                    <VCol cols="9">
                      <div class="font-weight-medium">
                        {{ rep.title }}
                      </div>
                      <div class="text-caption">
                        Role: {{ rep.roles.join(', ') }}
                      </div>
                    </VCol>
                  </VRow>
                </VCard>
              </VCol>
            </VRow>
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            text
            @click="dialogTampilkan = false"
          >
            Batal
          </VBtn>
          <VBtn
            text
            color="warning"
            @click="clearAndUnassignProfileHeader"
          >
            Clear
          </VBtn>
          <VBtn
            color="primary"
            @click="confirmAssignFromModal"
          >
            Ganti dan Tampilkan
          </VBtn>
        </VCardActions>
      </VCard>
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
.rounded-lg {
  border-radius: 12px;
}

.search-field {
  min-inline-size: 220px;
}

.skin--bordered .v-card.selected-card:not(.v-card--flat) {
  border: 1px solid rgb(var(--v-theme-primary)) !important;
  box-shadow: none !important;
}

.selected-card {
  border: 1px solid rgb(var(--v-theme-primary));
  box-shadow: none;
}

.preview-row {
  display: block;
}

/* Make the search / filter inputs and action buttons match heights */
.controls-row {
  display: flex;
  align-items: center;
}

/* normalize Vuetify control heights inside the controls row */
.controls-row ::v-deep(.v-field),
.controls-row ::v-deep(.v-text-field),
.controls-row ::v-deep(.v-select) {
  block-size: 40px;
  min-block-size: 40px;
}

.controls-row ::v-deep(.v-field .v-field__wrapper),
.controls-row ::v-deep(.v-select .v-field__wrapper) {
  block-size: 40px;
  min-block-size: 40px;
}

.controls-row ::v-deep(.v-btn) {
  block-size: 40px;
  min-block-size: 40px;
  padding-block: 0;
}

.controls-row ::v-deep(.v-btn .v-btn__content) {
  display: flex;
  align-items: center;
  block-size: 100%;
}
</style>
