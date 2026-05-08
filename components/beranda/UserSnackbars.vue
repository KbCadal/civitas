<script setup lang="ts">
import { computed, ref } from 'vue'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import { useAuthFetch } from '@/composables/useAuthFetch'

const keycloakStore = useKeycloakStore()

// Admin-only fetch of snackbars
const { data, refresh } = useAuthFetch('/api/admin/snackbars')

const items = computed(() => data.value?.snackbars || [])

const selectedId = ref<string | null>(null)
const selectedItem = computed(() => items.value.find((i: any) => i.id === selectedId.value) || null)

const selectedRoles = ref<Array<string>>([])
const roleOptions = [{ title: 'Mahasiswa', value: 'mahasiswa' }, { title: 'Dosen', value: 'dosen' }, { title: 'Staf', value: 'staf' }]

const searchQuery = ref('')

const filteredItems = computed(() => {
  const q = String(searchQuery.value || '').toLowerCase().trim()
  if (!q)
    return items.value

  return items.value.filter((it: any) => String(`${it.title || ''} ${it.body || ''}`).toLowerCase().includes(q))
})

const dialogAdd = ref(false)
const dialogEdit = ref(false)
const dialogDelete = ref(false)
const deleteTarget = ref<any>(null)

const form = ref({ title: '', iconPrepend: '', body: '' })

const dialogTampilkan = ref(false)
const modalSelectedRoles = ref<Array<string>>([])
const modalPriority = ref<string>('current')
const modalDate = ref({ mode: 'yearly', value: '' })
const modalReplacements = ref<any[]>([])

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

async function openAdd() {
  form.value = { title: '', iconPrepend: '', body: '' }
  dialogAdd.value = true
}

function openEdit(item: any) {
  form.value = { title: item.title || '', iconPrepend: item.iconPrepend || '', body: item.body || '' }
  dialogEdit.value = true
  selectedId.value = item.id
}

function confirmDelete(item: any) {
  deleteTarget.value = item
  dialogDelete.value = true
}

async function submitNew() {
  try {
    await $fetch('/api/admin/snackbars', {
      method: 'POST',
      body: { title: form.value.title, iconPrepend: form.value.iconPrepend, body: form.value.body },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Snackbar berhasil ditambahkan'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogAdd.value = false
    refresh()
    try { window.dispatchEvent(new CustomEvent('admin:snackbars:changed')) }
    catch (e) {}
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal menambahkan snackbar'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function submitEdit() {
  try {
    if (!selectedId.value)
      throw new Error('Tidak ada target untuk diupdate')

    await $fetch('/api/admin/snackbars', {
      method: 'PUT',
      body: { id: selectedId.value, title: form.value.title, iconPrepend: form.value.iconPrepend, body: form.value.body },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Snackbar berhasil diperbarui'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogEdit.value = false
    refresh()
    try { window.dispatchEvent(new CustomEvent('admin:snackbars:changed')) }
    catch (e) {}
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal memperbarui snackbar'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function performDelete() {
  try {
    const item = deleteTarget.value
    if (!item)
      throw new Error('Target tidak ditentukan')

    await $fetch('/api/admin/snackbars', {
      method: 'DELETE',
      body: { id: item.id },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Snackbar berhasil dihapus'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogDelete.value = false
    deleteTarget.value = null
    refresh()
    try { window.dispatchEvent(new CustomEvent('admin:snackbars:changed')) }
    catch (e) {}
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal menghapus snackbar'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

function toggleSelect(item: any) {
  if (selectedId.value === item.id)
    selectedId.value = null
  else
    selectedId.value = item.id
}

function openTampilkan() {
  if (!selectedId.value) {
    snackbarMessage.value = 'Pilih snackbar terlebih dahulu'
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

async function previewAssign() {
  try {
    const res: any = await $fetch('/api/admin/snackbars/assign', {
      method: 'POST',
      body: { id: selectedId.value, roles: modalSelectedRoles.value, priority: modalPriority.value, date: modalDate.value },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    if (res?.confirmRequired) {
      modalReplacements.value = res.replacements || []

      return
    }

    await $fetch('/api/admin/snackbars/assign', {
      method: 'POST',
      body: { id: selectedId.value, roles: modalSelectedRoles.value, priority: modalPriority.value, date: modalDate.value, confirm: true },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    dialogTampilkan.value = false
    snackbarMessage.value = 'Snackbar berhasil ditampilkan untuk role yang dipilih'
    snackbarColor.value = 'success'
    snackbar.value = true
    refresh()
    try { window.dispatchEvent(new CustomEvent('admin:snackbars:changed')) }
    catch (e) {}
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal melakukan preview tampilan'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function confirmAssignFromModal() {
  try {
    await $fetch('/api/admin/snackbars/assign', {
      method: 'POST',
      body: { id: selectedId.value, roles: modalSelectedRoles.value, priority: modalPriority.value, date: modalDate.value, confirm: true },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    dialogTampilkan.value = false
    modalReplacements.value = []
    snackbarMessage.value = 'Snackbar berhasil ditampilkan dan menggantikan yang sebelumnya'
    snackbarColor.value = 'success'
    snackbar.value = true
    refresh()
    try { window.dispatchEvent(new CustomEvent('admin:snackbars:changed')) }
    catch (e) {}
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal melakukan tampilan'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function clearAndUnassign() {
  try {
    if (!selectedId.value)
      throw new Error('Tidak ada snackbar yang dipilih')

    // Send assign with empty roles to remove automatic display for this item
    await $fetch('/api/admin/snackbars/assign', {
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

    snackbarMessage.value = 'Penempatan otomatis dihapus untuk snackbar ini'
    snackbarColor.value = 'success'
    snackbar.value = true

    refresh()
    try { window.dispatchEvent(new CustomEvent('admin:snackbars:changed')) }
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
            <span>Snackbars Gallery</span>
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
                placeholder="Cari snackbars"
                dense
                hide-details
                clearable
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
                Tambah Snackbar
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
                class="p-6 pa-6"
                outlined
                :elevation="selectedId === item.id ? 12 : 2"
                :class="{ 'selected-card': selectedId === item.id }"
                style="cursor: pointer;"
                @click="toggleSelect(item)"
              >
                <VRow>
                  <VCol
                    cols="12"
                    md="8"
                  >
                    <div class="font-weight-medium">
                      {{ item.title }}
                    </div>
                    <div class="text-caption">
                      {{ item.body }}
                    </div>
                  </VCol>
                  <VCol
                    cols="12"
                    md="4"
                    class="d-flex flex-column align-end gap-2"
                  >
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
                  </VCol>
                </VRow>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Add/Edit/Delete/Tampilkan dialogs (simpler versions) -->
    <VDialog
      v-model="dialogAdd"
      width="600"
      class="p-6"
    >
      <template #default>
        <VCard class="pa-6">
          <VCardTitle>Tambah Snackbar</VCardTitle>
          <VCardText>
            <VForm>
              <VTextField
                v-model="form.title"
                label="Title"
                class="mb-4"
              />
              <VTextField
                v-model="form.iconPrepend"
                label="Icon (emoji or text)"
                class="mb-4"
              />
              <VTextField
                v-model="form.body"
                label="Body"
                class="mb-4"
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
              @click="submitNew"
            >
              Simpan
            </VBtn>
          </VCardActions>
        </VCard>
      </template>
    </VDialog>

    <VDialog
      v-model="dialogEdit"
      width="600"
      class="p-6"
    >
      <template #default>
        <VCard class="pa-6">
          <VCardTitle>Edit Snackbar</VCardTitle>
          <VCardText>
            <VForm>
              <VTextField
                v-model="form.title"
                label="Title"
                class="mb-4"
              />
              <VTextField
                v-model="form.iconPrepend"
                label="Icon (emoji or text)"
                class="mb-4"
              />
              <VTextField
                v-model="form.body"
                label="Body"
                class="mb-4"
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
              @click="submitEdit"
            >
              Simpan
            </VBtn>
          </VCardActions>
        </VCard>
      </template>
    </VDialog>

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
            Yakin ingin menghapus snackbar <div class="font-weight-bold">
              {{ deleteTarget?.title }}
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
            @click="performDelete"
          >
            Hapus
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog
      v-model="dialogTampilkan"
      class="pa-6"
      max-width="900"
    >
      <VCard class="pa-6">
        <VCardTitle class="mb-4">
          Tampilkan Snackbar
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
              :items="[{ title: 'Umum / Current', value: 'current' }, { title: 'Birthday', value: 'birthday' }, { title: 'Specific date', value: 'date' }]"
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
                :items="[{ title: 'Every year (MM-DD)', value: 'yearly' }, { title: 'Every month (DD)', value: 'monthly' }, { title: 'Every day', value: 'daily' }, { title: 'Only once (YYYY-MM-DD)', value: 'once' }]"
                item-title="title"
                item-value="value"
                label="Recurrence"
                dense
                class="mb-4"
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
              Snackbar yang akan digantikan:
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
                      <div class="font-weight-medium">
                        {{ rep.title }}
                      </div>
                    </VCol>
                    <VCol cols="9">
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
            @click="clearAndUnassign"
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
.search-field {
  min-inline-size: 220px;
}

.controls-row {
  display: flex;
  align-items: center;
}

/* normalize Vuetify control heights inside the controls row */
/* stylelint-disable selector-pseudo-element-no-unknown */
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
/* stylelint-enable selector-pseudo-element-no-unknown */

.selected-card {
  border: 1px solid rgb(var(--v-theme-primary));
  box-shadow: none;
}
</style>
