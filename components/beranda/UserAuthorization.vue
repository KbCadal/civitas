<script setup lang="ts">
import { computed, ref } from 'vue'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import { useAuthFetch } from '@/composables/useAuthFetch'

const keycloakStore = useKeycloakStore()

const { data, pending, error, refresh } = useAuthFetch('/api/admin/authorization')

const search = ref('')

const filtered = computed(() => {
  const q = String(search.value || '').trim().toLowerCase()
  if (!q)
    return data.value?.allowed ?? []

  return (data.value?.allowed ?? []).filter((k: string) => k.toLowerCase().includes(q))
})

const authItems = computed(() => (filtered.value ?? []).map((k: string) => ({ preferred_username: k })))

const dialogDelete = ref(false)
const deleteTarget = ref('')

// modal & form
const dialogAdd = ref(false)
const dialogEdit = ref(false)
const editTarget = ref('')
const kodeForm = ref('')

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

async function addKode() {
  try {
    if (!kodeForm.value) {
      snackbarMessage.value = 'Masukkan preferred_username terlebih dahulu'
      snackbarColor.value = 'warning'
      snackbar.value = true

      return
    }

    await $fetch('/api/admin/authorization', {
      method: 'POST',
      body: { preferred_username: kodeForm.value },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Kode berhasil ditambahkan'
    snackbarColor.value = 'success'
    snackbar.value = true
    kodeForm.value = ''
    dialogAdd.value = false
    refresh()

    // notify other parts of the UI that the allowlist changed
    try { window.dispatchEvent(new CustomEvent('admin:authorization:changed')) }
    catch (e) {}
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal menambahkan kode'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

function openEdit(k: string) {
  editTarget.value = k
  kodeForm.value = k
  dialogEdit.value = true
}

async function submitEdit() {
  try {
    if (!editTarget.value || !kodeForm.value) {
      snackbarMessage.value = 'Input tidak lengkap'
      snackbarColor.value = 'warning'
      snackbar.value = true

      return
    }

    await $fetch('/api/admin/authorization', {
      method: 'PUT',
      body: { oldPreferredUsername: editTarget.value, newPreferredUsername: kodeForm.value },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Kode berhasil diperbarui'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogEdit.value = false
    editTarget.value = ''
    kodeForm.value = ''
    refresh()
    try { window.dispatchEvent(new CustomEvent('admin:authorization:changed')) }
    catch (e) {}
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal memperbarui kode'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function deleteKode(k: string) {
  // open confirmation dialog
  deleteTarget.value = k
  dialogDelete.value = true
}

async function performDeleteKode() {
  try {
    const k = deleteTarget.value
    if (!k)
      throw new Error('Target tidak ditentukan')

    await $fetch('/api/admin/authorization', {
      method: 'DELETE',
      body: { preferred_username: k },
      headers: { Authorization: `Bearer ${keycloakStore.accessToken}` },
    })

    snackbarMessage.value = 'Kode berhasil dihapus'
    snackbarColor.value = 'success'
    snackbar.value = true
    dialogDelete.value = false
    deleteTarget.value = ''
    refresh()
    try { window.dispatchEvent(new CustomEvent('admin:authorization:changed')) }
    catch (e) {}
  }
  catch (err: any) {
    snackbarMessage.value = err?.data?.message || err?.message || 'Gagal menghapus kode'
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
            <span>Daftar Username Admin</span>
            <VSpacer />
          </VCardTitle>
          <!-- controls row placed beneath title -->
          <div class="auth-controls d-flex gap-3 mt-3 align-center">
            <VTextField
              v-model="search"
              append-inner-icon="ri-search-line"
              placeholder="Cari kode..."
              dense
              outlined
              style="min-inline-size: 18rem;"
            />
            <VBtn
              color="primary"
              @click="dialogAdd = true"
            >
              Tambah Admin Baru
            </VBtn>
          </div>
        </VCardItem>

        <VForm>
          <div class="pb-6">
            <VDataTable
              :headers="[{ title: 'Preferred Username', key: 'preferred_username' }, { title: 'Actions', key: 'actions' }]"
              :items="authItems"
              hide-default-footer
            >
              <template #item.preferred_username="{ item }">
                <div>{{ item.preferred_username }}</div>
              </template>

              <template #item.actions="{ item }">
                <div class="d-flex gap-2">
                  <VBtn
                    size="small"
                    variant="tonal"
                    @click="openEdit(item.preferred_username)"
                  >
                    Edit
                  </VBtn>
                  <VBtn
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteKode(item.preferred_username)"
                  >
                    Delete
                  </VBtn>
                </div>
              </template>
            </VDataTable>
          </div>
        </VForm>
      </VCard>
    </VCol>

    <VDialog
      v-model="dialogAdd"
      width="480"
    >
      <template #default>
        <VCard>
          <VCardItem class="pb-6">
            <VCardTitle>Tambah Username Admin</VCardTitle>
          </VCardItem>
          <VCardText>
            <VForm>
              <VTextField
                v-model="kodeForm"
                label="preferred_username"
                class="my-2"
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
              @click="addKode"
            >
              Tambah
            </VBtn>
          </VCardActions>
        </VCard>
      </template>
    </VDialog>

    <VDialog
      v-model="dialogEdit"
      width="480"
    >
      <template #default>
        <VCard>
          <VCardItem class="pb-6">
            <VCardTitle>Edit preferred_username</VCardTitle>
          </VCardItem>
          <VCardText>
            <VForm>
              <VTextField
                v-model="kodeForm"
                label="preferred_username"
                class="my-2"
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

    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="4000"
      location="top"
    >
      {{ snackbarMessage }}
    </VSnackbar>

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
            Yakin ingin menghapus Admin
            <div class="font-weight-bold">
              {{ deleteTarget }}
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
            @click="performDeleteKode"
          >
            Hapus
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VRow>
</template>

<style scoped>
.my-2 { margin-block: 0.5rem; }
.mt-4 { margin-block-start: 1rem; }

/* auth controls sizing */
.auth-controls {
  align-items: center;
}

.auth-controls ::v-deep(.v-field),
.auth-controls ::v-deep(.v-text-field),
.auth-controls ::v-deep(.v-btn) {
  block-size: 40px;
  min-block-size: 40px;
}
</style>
