<script lang="ts" setup>
import { useKeycloakStore } from '@core/stores/keycloakStore'
import { computed, ref, watch } from 'vue'

const keycloakStore = useKeycloakStore()

const isCurrentPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const newPasswordError = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('error')
const showConfirmDialog = ref(false)

watch(newPassword, newValue => {
  if (currentPassword.value && newValue === currentPassword.value) {
    newPasswordError.value
      = 'Kata sandi baru tidak boleh sama dengan kata sandi lama.'
  }
  else {
    newPasswordError.value = ''
  }
})

const passwordRequirements = [
  'Panjang minimal 8 karakter, maksimal 20 karakter',
  'Minimal satu karakter huruf besar',
  'Minimal satu angka',
  'Minimal satu simbol',
]

// Aturan Validasi
const oldPasswordRules = [
  (v: string) => !!v || 'Konfirmasi kata sandi diperlukan',
]

const passwordRules = [
  (v: string) => !!v || 'Kata sandi diperlukan',
  (v: string) => v.length >= 8 || 'Kata sandi minimal terdiri dari 8 karakter',
  (v: string) =>
    /[a-z]/.test(v) || 'Kata sandi setidaknya mengandung satu huruf kecil',
  (v: string) =>
    /[A-Z]/.test(v) || 'Kata sandi setidaknya mengandung satu huruf besar',
  (v: string) => /\d/.test(v) || 'Kata sandi setidaknya berisi satu angka',
  (v: string) =>
    /[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/.test(v)
    || 'Kata sandi setidaknya mengandung satu simbol',
  (v: string) => !/\s/.test(v) || 'Kata sandi tidak boleh mengandung spasi',
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Konfirmasi kata sandi diperlukan',
  (v: string) => v === newPassword.value || 'Kata sandi tidak cocok',
]

// Generate Password
function generatePassword(length: number = 10): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'

  // Remove space from symbols
  const symbols = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

  // At least one character from each required category
  const mandatoryCharacters = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ]

  // Combine all character sets into one charset
  const allCharacters = lowercase + uppercase + numbers + symbols
  const remainingLength = length - mandatoryCharacters.length
  let password = mandatoryCharacters

  // Fill the rest of the password with random characters from the combined charset
  for (let i = 0; i < remainingLength; i++) {
    const randomChar
      = allCharacters[Math.floor(Math.random() * allCharacters.length)]

    password.push(randomChar)
  }

  // Shuffle the password to ensure randomness
  password = password.sort(() => Math.random() - 0.5)

  // Return the password as a string, filter out any accidental spaces (just in case)
  return password.join('').replace(/\s/g, '')
}

// fungsi untuk encoding Base64
function toBase64(str: string) {
  return btoa(unescape(encodeURIComponent(str)))
}

const { api } = useCivitasApi()

// Set Password
async function setPassword() {
  isSubmitting.value = true

  if (isEmpty(currentPassword.value)) {
    snackbarMessage.value = 'Kata Sandi Lama tidak boleh kosong'
    snackbarColor.value = 'error'
    snackbar.value = true
    isSubmitting.value = false // <-- FIX

    return
  }

  if (
    newPassword.value.length < 8
    || !/[a-z]/.test(newPassword.value)
    || !/[A-Z]/.test(newPassword.value)
    || !/\d/.test(newPassword.value)
    || !/[!"#$%&'()*+,\-./:;<=>?@[\\]^_`\{|\}~\]/.test(newPassword.value)
    || /\s/.test(newPassword.value)
  ) {
    snackbarMessage.value = 'Kata Sandi harus memiliki minimal 8 karakter, setidaknya satu huruf kecil, satu huruf besar, satu angka, satu simbol, dan tidak boleh mengandung spasi.'
    snackbarColor.value = 'error'
    snackbar.value = true
    isSubmitting.value = false // <-- FIX

    return
  }

  if (newPassword.value === currentPassword.value) {
    snackbarMessage.value = 'Kata sandi baru tidak boleh sama dengan kata sandi lama.'
    snackbarColor.value = 'error'
    snackbar.value = true
    isSubmitting.value = false // <-- FIX

    return
  }

  if (newPassword.value !== confirmPassword.value) {
    snackbarMessage.value = 'Kata Sandi Baru dan Konfirmasi Kata Sandi tidak cocok.'
    snackbarColor.value = 'error'
    snackbar.value = true
    isSubmitting.value = false // <-- FIX

    return
  }

  try {
    // Panggil API untuk mengganti password
    const requestData = {
      oldPassword: toBase64(currentPassword.value),
      newPassword: toBase64(newPassword.value),
    }

    // const apiEndpoint = 'https://api.ui.ac.id/my/pw'

    // const response = await fetch(apiEndpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${keycloakStore.accessToken}`,
    //   },
    //   body: JSON.stringify(requestData),
    // })

    console.log('🚀 Starting password change API call...')
    console.log('📤 Request data:', requestData)

    // Use $fetch directly as suggested by Nuxt for mounted components
    try {
      const response = await $fetch('/my/pw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloakStore.accessToken}`,
        },
        body: requestData,
        baseURL: 'https://api.ui.ac.id',
      })

      console.log('📥 API Response:', response)
      console.log('✅ Password change successful!')

      // If we reach here, the password change was successful
      snackbarMessage.value = 'Kata sandi berhasil diubah. Silakan logout dan login kembali dengan kata sandi baru.'
      snackbarColor.value = 'success'
      snackbar.value = true
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    }
    catch (fetchError: any) {
      console.log('❌ Fetch Error:', fetchError)

      // Handle specific error cases
      if (fetchError.status === 401)
        throw new Error('Kata sandi lama tidak sesuai')

      throw new Error(fetchError.data?.message || fetchError.message || 'Gagal mengubah password')
    }
  }
  catch (error) {
    // Handle error
    if (error instanceof Error) {
      snackbarMessage.value = error.message
      snackbarColor.value = 'error'
      snackbar.value = true
    }
    else {
      snackbarMessage.value = 'Terjadi kesalahan saat mengubah kata sandi'
      snackbarColor.value = 'error'
      snackbar.value = true
    }
  }
  finally {
    isSubmitting.value = false
  }

  // Reset input
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

const passwordRequirementChecks = computed(() => [
  {
    label: 'Panjang minimal 8 karakter, maksimal 20 karakter',
    valid: newPassword.value.length >= 8 && newPassword.value.length <= 20,
  },
  {
    label: 'Minimal satu karakter huruf besar',
    valid: /[A-Z]/.test(newPassword.value),
  },
  {
    label: 'Minimal satu angka',
    valid: /\d/.test(newPassword.value),
  },
  {
    label: 'Minimal satu simbol',
    valid: /[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/.test(newPassword.value),
  },
  {
    label: 'Tidak boleh mengandung spasi',
    valid: !/\s/.test(newPassword.value),
  },
])
</script>

<template>
  <VRow>
    <!-- SECTION: Change Password -->
    <VCol cols="12">
      <VCard>
        <VCardItem class="pb-6">
          <VCardTitle>Ganti Kata Sandi</VCardTitle>
        </VCardItem>
        <VForm>
          <VCardText class="pt-0">
            <!-- 👉 Current Password -->
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="currentPassword"
                  :type="isCurrentPasswordVisible ? 'text' : 'password'"
                  :maxlength="20"
                  :append-inner-icon="isCurrentPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  autocomplete="on"
                  label="Kata Sandi Lama"
                  :rules="oldPasswordRules"
                  clearable
                  @click:append-inner="isCurrentPasswordVisible = !isCurrentPasswordVisible"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="newPassword"
                  :type="isNewPasswordVisible ? 'text' : 'password'"
                  :maxlength="20"
                  :append-inner-icon="isNewPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  label="Kata Sandi Baru"
                  autocomplete="on"
                  :rules="passwordRules"
                  :error-messages="newPasswordError"
                  clearable
                  @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="confirmPassword"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :maxlength="20"
                  :append-inner-icon="isConfirmPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  autocomplete="on"
                  label="Konfirmasi Kata Sandi"
                  :rules="confirmPasswordRules"
                  clearable
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                />
              </VCol>
            </VRow>
          </VCardText>

          <VDivider />

          <VCardText>
            <div class="password-req-box pa-4 rounded-lg">
              <h6 class="text-h6 text-medium-emphasis">
                Persyaratan Kata Sandi:
              </h6>
              <VList
                density="compact"
                class="bg-transparent"
              >
                <VListItem
                  v-for="(item, index) in passwordRequirementChecks"
                  :key="index"
                  class="px-0"
                >
                  <template #prepend>
                    <VIcon
                      size="18"
                      :icon="item.valid ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill'"
                      :color="item.valid ? 'success' : 'error'"
                    />
                  </template>
                  <VListItemTitle
                    :class="item.valid ? 'text-success' : 'text-error'"
                    class="text-wrap"
                  >
                    {{ item.label }}
                  </VListItemTitle>
                </VListItem>
              </VList>
            </div>
            <div class="d-flex flex-wrap gap-4 justify-end">
              <VBtn
                :disabled="isSubmitting"
                color="primary"
                @click="showConfirmDialog = true"
              >
                {{ isSubmitting ? "Sedang Memproses..." : "Simpan Perubahan" }}
              </VBtn>
              <VBtn
                type="reset"
                color="secondary"
                variant="outlined"
                @click="
                  currentPassword = '';
                  newPassword = '';
                  confirmPassword = '';
                "
              >
                Reset
              </VBtn>
              <VBtn
                color="success"
                variant="outlined"
                @click="
                  newPassword = generatePassword();
                  confirmPassword = newPassword;
                "
              >
                Generate Kata Sandi
              </VBtn>
            </div>
          </VCardText>
        </VForm>
      </VCard>
    </VCol>
    <!-- !SECTION -->
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
          Yakin ingin mengganti password?
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
          @click="showConfirmDialog = false; setPassword()"
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

.password-req-box .v-list-item {
  margin-block-end: 0 !important;
  min-block-size: 28px !important;
  padding-block: 2px !important;
}

.text-success {
  color: #43a047 !important;
}

.text-error {
  color: #e53935 !important;
}
</style>
