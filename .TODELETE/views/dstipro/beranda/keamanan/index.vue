<script lang="ts" setup>
import { useKeycloakStore } from '@core/stores/keycloakStore'

const keycloakStore = useKeycloakStore()

const isCurrentPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const newPasswordError = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)

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
  'Minimal satu simbol, atau karakter spasi',
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
    /[ !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/.test(v)
    || 'Kata sandi setidaknya mengandung satu simbol atau spasi',
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
  const symbols = ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

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

  // Return the password as a string
  return password.join('')
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
    alert('Kata Sandi Lama tidak boleh kosong')

    return
  }

  // Buat objek data dengan password yang sudah di-encoding
  const requestData = {
    oldPassword: toBase64(currentPassword.value),
    newPassword: toBase64(newPassword.value),
  }

  if (
    newPassword.value.length < 8
    || !/[a-z]/.test(newPassword.value)
    || !/\d/.test(newPassword.value)
    || !/[ !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/.test(newPassword.value)
  ) {
    alert(
      'Kata Sandi harus memiliki minimal 8 karakter, setidaknya satu huruf besar, satu angka, dan satu karakter khusus.',
    )

    return
  }

  if (newPassword.value === currentPassword.value) {
    alert('Kata sandi baru tidak boleh sama dengan kata sandi lama.')

    return
  }

  if (newPassword.value !== confirmPassword.value) {
    alert('Kata Sandi Baru dan Konfirmasi Kata Sandi tidak cocok.')

    return
  }

  try {
    // Panggil API untuk mengganti password
    // const apiEndpoint = 'https://api.ui.ac.id/my/pw'

    // const response = await fetch(apiEndpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${keycloakStore.accessToken}`,
    //   },
    //   body: JSON.stringify(requestData),
    // })

    const { response } = await api.user.changePassword(requestData)

    // Check for HTTP status code 401 which indicates old password is incorrect
    if (response.status === 401)
      throw new Error('Kata sandi lama tidak sesuai')

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Gagal mengubah password')
    }

    // Jika berhasil, tampilkan pesan dan reset form
    alert(
      'Kata sandi berhasil diubah. Silakan logout dan login kembali dengan kata sandi baru.',
    )
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }
  catch (error) {
    // Handle error
    if (error instanceof Error)
      alert(error.message)
    else
      alert('Terjadi kesalahan saat mengubah kata sandi')
  }
  finally {
    isSubmitting.value = false
  }

  // Reset input
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}
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
                <!-- 👉 current password -->
                <VTextField
                  v-model="currentPassword"
                  :type="isCurrentPasswordVisible ? 'text' : 'password'"
                  :maxlength="20"
                  :append-inner-icon="
                    isCurrentPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'
                  "
                  autocomplete="on"
                  label="Kata Sandi Lama"
                  :rules="oldPasswordRules"
                  clearable
                  @click:append-inner="
                    isCurrentPasswordVisible = !isCurrentPasswordVisible
                  "
                />
              </VCol>
            </VRow>

            <!-- 👉 New Password -->
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <!-- 👉 new password -->
                <VTextField
                  v-model="newPassword"
                  :type="isNewPasswordVisible ? 'text' : 'password'"
                  :maxlength="20"
                  :append-inner-icon="
                    isNewPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'
                  "
                  label="Kata Sandi Baru"
                  autocomplete="on"
                  :rules="passwordRules"
                  :error-messages="newPasswordError"
                  clearable
                  @click:append-inner="
                    isNewPasswordVisible = !isNewPasswordVisible
                  "
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <!-- 👉 confirm password -->
                <VTextField
                  v-model="confirmPassword"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :maxlength="20"
                  :append-inner-icon="
                    isConfirmPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'
                  "
                  autocomplete="on"
                  label="Konfirmasi Kata Sandi"
                  :rules="confirmPasswordRules"
                  clearable
                  @click:append-inner="
                    isConfirmPasswordVisible = !isConfirmPasswordVisible
                  "
                />
              </VCol>
            </VRow>
          </VCardText>

          <!-- 👉 Password Requirements -->
          <VCardText>
            <h6 class="text-h6 text-medium-emphasis mt-1">
              Persyaratan Kata Sandi:
            </h6>

            <VList>
              <VListItem
                v-for="(item, index) in passwordRequirements"
                :key="index"
                class="px-0 mt-n4 mb-n2"
              >
                <template #prepend>
                  <VIcon
                    size="8"
                    icon="ri-circle-fill"
                    color="rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity))"
                  />
                </template>
                <VListItemTitle class="text-medium-emphasis text-wrap">
                  {{ item }}
                </VListItemTitle>
              </VListItem>
            </VList>

            <!-- 👉 Action Buttons -->
            <div class="d-flex flex-wrap gap-4">
              <VBtn
                :disabled="isSubmitting"
                @click="setPassword"
              >
                {{
                  isSubmitting ? "Sedang Memproses..." : "Simpan Perubahan"
                }}
              </VBtn>

              <VBtn
                type="reset"
                color="secondary"
                variant="outlined"
              >
                Reset
              </VBtn>
              <VBtn
                color="secondary"
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
</template>
