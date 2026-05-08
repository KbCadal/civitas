<script setup lang="ts">
import { ref } from 'vue'

const selectedMailbox = ref('webmail')
const showConfirmDialog = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const mailboxOptions = [
  { label: 'GMail (gmail.ui.ac.id)', value: 'gmail' },
  { label: 'Webmail UI (webmail.ui.ac.id)', value: 'webmail' },
]

function saveMailboxChange() {
  // Dummy save logic
  snackbarMessage.value = `Mailbox berhasil diubah ke ${selectedMailbox.value === 'gmail' ? 'GMail' : 'Webmail UI'}.`
  snackbarColor.value = 'success'
  snackbar.value = true
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem class="pb-6">
          <VCardTitle class="d-flex align-center gap-2">
            <span>Surat Elektronik</span>
            <VSpacer />
            <span class="text-caption text-medium-emphasis">Sabtu, 30 Agustus 2025 19:41:11 +0700</span>
          </VCardTitle>
        </VCardItem>
        <VForm>
          <VCardText class="pt-0">
            <VAlert
              type="info"
              class="mb-4"
              border="start"
              color="warning"
              variant="tonal"
            >
              <div class="font-weight-bold mb-1">
                Pilihan Perubahan MailBox sedang di tutup untuk saat ini:
              </div>
              <ul class="mb-0 ps-4">
                <li>
                  GMail (<a
                    href="https://gmail.ui.ac.id"
                    target="_blank"
                    rel="noopener noreferrer"
                  >gmail.ui.ac.id</a>)
                </li>
                <li>
                  Webmail UI (<a
                    href="https://webmail.ui.ac.id"
                    target="_blank"
                    rel="noopener noreferrer"
                  >webmail.ui.ac.id</a>)
                </li>
              </ul>
            </VAlert>
            <div class="mb-4">
              <div class="text-subtitle-1 font-weight-bold mb-1">
                Pilih Mailbox:
              </div>
              <VRadioGroup
                v-model="selectedMailbox"
                :disabled="true"
                class="mb-2"
              >
                <VRadio
                  v-for="option in mailboxOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </VRadioGroup>
              <div class="d-flex flex-wrap gap-4 justify-end">
                <VBtn
                  color="primary"
                  :disabled="true"
                  @click="showConfirmDialog = true"
                >
                  Simpan Perubahan
                </VBtn>
              </div>
            </div>
            <VDivider class="my-4" />
            <div class="mb-4">
              <div class="text-subtitle-1 font-weight-bold mb-1">
                Keterangan:
              </div>
              <ul class="ps-4 mb-2">
                <li>
                  <b>GMail</b>
                  <span class="text-error">(Saat ini Out of Service/ tidak bisa digunakan)</span>
                </li>
                <li>
                  <b>Webmail UI</b><br>
                  Seluruh Email Anda akan diarahkan ke MailBox yang dikelola oleh Universitas Indonesia. Email Anda dapat diakses di
                  <a
                    href="https://webmail.ui.ac.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >https://webmail.ui.ac.id/</a>.
                </li>
                <li>
                  <b>Zimbra UI</b><br>
                  Seluruh Email Anda akan diarahkan ke MailBox Zimbra yang dikelola oleh Universitas Indonesia. Email Anda dapat diakses di
                  <a
                    href="https://zimbra.ui.ac.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >https://zimbra.ui.ac.id/</a>.
                </li>
              </ul>
            </div>
          </VCardText>
        </VForm>
      </VCard>
    </VCol>
  </VRow>
  <VSnackbar
    v-model="snackbar"
    :color="snackbarColor"
    timeout="4000"
    location="top"
  >
    {{ snackbarMessage }}
    <template #actions>
      <VBtn
        icon
        variant="text"
        color="white"
        @click="snackbar = false"
      >
        <VIcon icon="ri-close-line" />
      </VBtn>
    </template>
  </VSnackbar>
  <VDialog
    v-model="showConfirmDialog"
    max-width="400"
  >
    <VCard>
      <VCardTitle class="text-h6 d-flex flex-column align-center justify-center pt-6 pb-2">
        <VIcon
          color="warning"
          size="36"
          class="mb-2"
        >
          ri-lock-line
        </VIcon>
        <span>Konfirmasi</span>
      </VCardTitle>
      <VCardText class="text-center py-6">
        <div class="mb-2 text-h6">
          Yakin ingin mengganti Mailbox ke
          <span class="font-weight-bold">
            {{ selectedMailbox === 'gmail' ? 'GMail' : 'Webmail UI' }}?
          </span>
        </div>
        <div class="text-caption text-medium-emphasis">
          Tindakan ini tidak dapat dibatalkan.
        </div>
      </VCardText>
      <VCardActions class="justify-end px-4 pb-4">
        <VBtn
          color="secondary"
          variant="text"
          @click="showConfirmDialog = false"
        >
          Batal
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          class="font-weight-bold"
          @click="showConfirmDialog = false; saveMailboxChange()"
        >
          Yakin
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.password-req-box {
  border-radius: 12px;
}

.text-success {
  color: #43a047 !important;
}

.text-error {
  color: #e53935 !important;
}
</style>
