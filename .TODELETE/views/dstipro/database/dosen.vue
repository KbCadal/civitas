<script setup lang="ts">
import type { SalesDetails } from '@db/pages/datatable/types'
import { useKeycloakStore } from '@/@core/stores/keycloakStore'

const keycloakStore = useKeycloakStore()
const { api } = useCivitasApi()

// Gunakan computed agar selalu reaktif
const isAuthenticated = computed(() => keycloakStore.authenticated)

const { data: productList } = await useApi<SalesDetails[]>('pages/datatable')

const search = ref('')

// headers
const headers = [
  { title: 'PRODUCT', key: 'product.name' },
  { title: 'DATE', key: 'date' },
  { title: 'CATEGORY', key: 'product.category' },
  { title: 'BUYERS', key: 'buyer.name' },
  { title: 'PAYMENT', key: 'payment', sortable: false },
  { title: 'STATUS', key: 'status', sortable: false },
  { title: 'DELETE', key: 'delete', sortable: false },
]

// 👉 methods
const deleteItem = (itemId: number) => {
  if (!productList.value)
    return

  const index = productList.value.findIndex(item => item.product.id === itemId)

  productList.value.splice(index, 1)
}

const categoryIcons = [
  { name: 'Mouse', icon: 'ri-mouse-fill', color: 'warning' },
  { name: 'Glass', icon: 'ri-glasses-line', color: 'primary' },
  { name: 'Smart Watch', icon: 'ri-time-line', color: 'success' },
  { name: 'Bag', icon: 'ri-shopping-bag-line', color: 'info' },
  { name: 'Storage Device', icon: 'ri-tape-line', color: 'warning' },
  { name: 'Bluetooth', icon: 'ri-bluetooth-line', color: 'error' },
  { name: 'Gaming', icon: 'ri-gamepad-line', color: 'warning' },
  { name: 'Home', icon: 'ri-home-line', color: 'error' },
  { name: 'VR', icon: 'ri-goggles-line', color: 'primary' },
  { name: 'Shoes', icon: 'ri-omega', color: 'success' },
  { name: 'Electronics', icon: 'ri-flashlight-fill', color: 'info' },
  { name: 'Projector', icon: 'ri-projector-line', color: 'warning' },
  { name: 'iPod', icon: 'ri-music-line', color: 'error' },
  { name: 'Keyboard', icon: 'ri-keyboard-box-line', color: 'primary' },
  { name: 'Smart Phone', icon: 'ri-smartphone-line', color: 'success' },
  { name: 'Smart TV', icon: 'ri-tv-line', color: 'info' },
  { name: 'Google Home', icon: 'ri-google-line', color: 'warning' },
  { name: 'Mac', icon: 'ri-apple-line', color: 'error' },
  { name: 'Headphone', icon: 'ri-headphone-line', color: 'primary' },
  { name: 'iMac', icon: 'ri-computer-line', color: 'success' },
  { name: 'iPhone', icon: 'ri-apple-line', color: 'warning' },
]

const resolveStatusColor = (status: string) => {
  if (status === 'Confirmed')
    return 'primary'
  if (status === 'Completed')
    return 'success'
  if (status === 'Cancelled')
    return 'error'
}

const categoryIconFilter = (categoryName: string): {
  icon: string
  color: string
}[] => {
  const index = categoryIcons.findIndex(category => category.name === categoryName)

  if (index !== -1)
    return [{ icon: categoryIcons[index].icon, color: categoryIcons[index].color }]

  return [{ icon: 'ri-question-line', color: 'primary' }]
}

// Tabel dan Filter dari API
const headersapi: Header[] = [
  { title: 'Foto', key: 'foto', align: 'start', sortable: false },
  { title: 'NIP', key: 'nip', sortable: true },
  { title: 'Nama', key: 'nama', sortable: true },
  { title: 'Kode Fakultas', key: 'org', sortable: true },
  { title: 'Aksi', key: 'operation', align: 'start', sortable: false },
]

const items = ref<JsonDosen[]>([])
const searchText = ref('')
const loading = ref(false)
const dialogView = ref(false)
const dialogEdit = ref(false)
const dialogDelete = ref(false)
const selectedDosen = ref<JsonDosen | null>(null)
const dialogSetPassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const isPasswordNewVisible = ref(false)
const isPasswordKonfVisible = ref(false)

// Interface
interface JsonDosen {
  nip: string
  nama: string
  org: string
}

// Filter Data Berdasarkan Pencarian
const filteredItems = computed(() => {
  if (!searchText.value)
    return items.value
  const query = searchText.value.toLowerCase()

  return items.value.filter(item =>
    [item.nip, item.nama].some(field =>
      field.toLowerCase().includes(query),
    ),
  )
})

// Ambil Data dari API
onMounted(() => {
  getData()
})

async function getData() {
  loading.value = true
  error.value = ''
  try {
    const { response, error } = await api.dosen.getListDosen()

    const data = response.value?.value // ✅ UNWRAP the inner ref

    items.value = data
  }
  catch (err: any) {
    err.value = err.message || 'Terjadi kesalahan'
  }
  finally {
    loading.value = false
  }
}

// Buka Dialog View
function viewDosen(dosen: JsonDosen) {
  selectedDosen.value = dosen
  dialogView.value = true
}

// Buka Dialog Edit
function editDosen(dosen: JsonDosen) {
  selectedDosen.value = { ...dosen } // Buat salinan data dosen
  dialogEdit.value = true
}

// Simpan Perubahan
function saveChanges() {
  const updatedIndex = items.value.findIndex(
    item => item.nip === selectedDosen.value?.nip,
  )

  if (updatedIndex !== -1)
    items.value[updatedIndex] = { ...selectedDosen.value }

  dialogEdit.value = false
}

// Buka Dialog Delete
function confirmDelete(dosen: JsonDosen) {
  selectedDosen.value = dosen
  dialogDelete.value = true
}

// Hapus Data
function deleteDosen() {
  const deleteIndex = items.value.findIndex(
    item => item.nip === selectedDosen.value?.nip,
  )

  if (deleteIndex !== -1)
    items.value.splice(deleteIndex, 1)

  dialogDelete.value = false
}

// Buka Dialog Password
function viewSetPassword(dosen: JsonDosen) {
  selectedDosen.value = dosen
  dialogSetPassword.value = true
}

const passwordRequirements = [
  'Minimum 8 characters long - the more, the better',
  'At least one lowercase character',
  'At least one number',
  'At least one symbol, or whitespace character',
]

// Aturan Validasi
const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 8 || 'Password must be at least 8 characters long',
  (v: string) => /[a-z]/.test(v) || 'Password must contain at least one lowercase letter',
  (v: string) => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
  (v: string) => /\d/.test(v) || 'Password must contain at least one number',
  (v: string) => /[ !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/.test(v) || 'Password must contain at least one symbol or whitespace',
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Confirm password is required',
  (v: string) => v === newPassword.value || 'Passwords do not match',
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
    const randomChar = allCharacters[Math.floor(Math.random() * allCharacters.length)]

    password.push(randomChar)
  }

  // Shuffle the password to ensure randomness
  password = password.sort(() => Math.random() - 0.5)

  // Return the password as a string
  return password.join('')
}

// Set Password
function setPassword() {
  if (newPassword.value.length < 8 || !/[a-z]/.test(newPassword.value) || !/\d/.test(newPassword.value) || !/[ !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/.test(newPassword.value)) {
    alert('Password harus memiliki minimal 8 karakter, setidaknya satu huruf kecil, satu angka, dan satu karakter khusus.')

    return
  }

  if (newPassword.value !== confirmPassword.value) {
    alert('Password dan konfirmasi password tidak cocok.')

    return
  }

  // Simulasi pengubahan password
  // Di sini Anda bisa menambahkan logika untuk mengupdate password ke server
  alert(`Password atas nama ${selectedDosen.value?.nama} sudah diubah`)

  // Reset input
  newPassword.value = ''
  confirmPassword.value = ''
  dialogSetPassword.value = false
}
</script>

<template>
  <div v-if="isAuthenticated">
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          offset-md="8"
          md="4"
          sm="12"
        >
          <VTextField
            v-model="searchText"
            label="Search"
            placeholder="Search ..."
            append-inner-icon="ri-search-line"
            clearable
            hide-details
            dense
            outlined
            @click:clear="searchText = ''"
          />
        </VCol>
      </VRow>
    </VCardText>

    <!-- 👉 Data Table API  -->
    <VDataTable
      :headers="headersapi"
      :items="filteredItems || []"
      :search="searchText"
      :items-per-page="10"
      class="text-no-wrap"
    >
      <!-- Foto -->
      <template #item.foto="{ item }">
        <div class="d-flex align-center">
          <div>
            <VImg
              rounded="circle"
              :src="`https://api.ui.ac.id/public/photo/${item.nip}.jpg`"
              height="40"
              width="40"
            />
          </div>
        </div>
      </template>

      <!-- Nama -->
      <template #item.nama="{ item }">
        <div class="d-flex align-center">
          <VIcon
            size="18"
            class="bg-success rounded-0"
          >
            ri-user-follow-fill
          </VIcon> &nbsp;
          <span class="d-block font-weight-medium text-truncate text-high-emphasis">{{ item.nama }}</span>
        </div>
      </template>

      <!-- Aksi -->
      <template #item.operation="{ item }">
        <div class="d-flex align-center">
          <VBtn
            color="primary"
            size="small"
            icon
            @click="viewSetPassword(item)"
          >
            <VIcon icon="ri-lock-line" />
          </VBtn>
          <VBtn
            color="info"
            size="small"
            icon
            @click="viewDosen(item)"
          >
            <VIcon icon="ri-eye-line" />
          </VBtn>
          <VBtn
            color="warning"
            size="small"
            icon
            @click="editDosen(item)"
          >
            <VIcon icon="ri-pencil-line" />
          </VBtn>
          <VBtn
            color="error"
            size="small"
            icon
            @click="confirmDelete(item)"
          >
            <VIcon icon="ri-delete-bin-line" />
          </VBtn>
        </div>
      </template>
    </VDataTable>

    <!-- Dialog untuk Set Password -->
    <VDialog
      v-model="dialogSetPassword"
      persistent
      :max-width="$vuetify.display.smAndDown ? 'auto' : 400"
    >
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="dialogSetPassword = false; newPassword = ''; confirmPassword = '';"
      />

      <VCard class="pa-sm-5 pa-3">
        <VCardTitle class="text-center pb-5 text-h4">
          Set Password
        </VCardTitle>

        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="12"
              class="mb-n3"
            >
              <VAlert
                color="primary"
                variant="tonal"
                class="mb-3"
              >
                <p class="mb-0">
                  <strong>NIP:</strong> {{ selectedDosen?.nip }}
                </p>
                <p class="mb-0">
                  <strong>Nama:</strong> {{ selectedDosen?.nama }}
                </p>
              </VAlert>

              <VTextField
                v-model="newPassword"
                label="Password Baru"
                :maxlength="20"
                :type="isPasswordNewVisible ? 'text' : 'password'"
                :append-inner-icon="isPasswordNewVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                :rules="passwordRules"
                clearable
                outlined
                dense
                @click:append-inner="isPasswordNewVisible = !isPasswordNewVisible"
              />
            </VCol>
            <VCol
              cols="12"
              md="12"
            >
              <VTextField
                v-model="confirmPassword"
                label="Konfirmasi Password"
                :maxlength="20"
                :type="isPasswordKonfVisible ? 'text' : 'password'"
                :append-inner-icon="isPasswordKonfVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                :rules="confirmPasswordRules"
                clearable
                outlined
                dense
                @click:append-inner="isPasswordKonfVisible = !isPasswordKonfVisible"
              />
            </VCol>
          </VRow>
          <VRow class="pl-3">
            <h6 class="text-h6 text-body-2 mt-1">
              Password Requirements:
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
                <VListItemTitle class="text-body-2 text-wrap">
                  {{ item }}
                </VListItemTitle>
              </VListItem>
            </VList>
          </VRow>
        </VCardText>

        <VCardActions class="ma-n3">
          <VCol
            cols="12"
            class="d-flex flex-wrap justify-center gap-2"
          >
            <VBtn
              class="bg-warning"
              color="white"
              variant="tonal"
              @click="setPassword"
            >
              Save
            </VBtn>
            <VBtn
              color="primary"
              variant="outlined"
              @click="dialogSetPassword = false; newPassword = ''; confirmPassword = '';"
            >
              Cancel
            </VBtn>
            <VBtn
              color="secondary"
              variant="outlined"
              @click="newPassword = generatePassword(); confirmPassword = newPassword"
            >
              Generate Password
            </VBtn>
          </VCol>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog untuk Detail -->
    <VDialog
      v-model="dialogView"
      persistent
      :max-width="$vuetify.display.smAndDown ? 'auto' : 600"
    >
      <!-- 👉 dialog close btn -->
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="dialogView = false"
      />

      <VCard class="pa-sm-5 pa-3">
        <VCardTitle class="text-center pb-5 text-h4">
          Detail Dosen
        </VCardTitle>
        <VCardText>
          <div class="d-flex align-center">
            <VImg
              v-if="selectedDosen"
              rounded="circle"
              :src="`https://api.ui.ac.id/public/photo/${selectedDosen.nip}.jpg`"
              height="150"
              width="150"
              class="mb-4"
            />
          </div>
          <VAlert
            color="primary"
            variant="tonal"
          >
            <p class="mb-0">
              <strong>NIP:</strong> {{ selectedDosen?.nip }}
            </p>
            <p class="mb-0">
              <strong>Nama:</strong> {{ selectedDosen?.nama }}
            </p>
            <p class="mb-0">
              <strong>Kode Fakultas:</strong> {{ selectedDosen?.org }}
            </p>
          </VAlert>
        </VCardText>

        <VCardActions class="ma-n3">
          <!-- <VSpacer /> -->
          <!-- 👉 Close -->
          <VCol
            cols="12"
            class="d-flex flex-wrap justify-center gap-2"
          >
            <VBtn
              class="bg-info"
              color="white"
              variant="tonal"
              @click="dialogView = false"
            >
              Close
            </VBtn>
          </VCol>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog untuk Edit -->
    <VDialog
      v-model="dialogEdit"
      persistent
      :max-width="$vuetify.display.smAndDown ? 'auto' : 600"
    >
      <!-- 👉 dialog close btn -->
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="dialogEdit = false"
      />

      <VCard class="pa-sm-5 pa-3">
        <VCardTitle class="text-center pb-5 text-h4">
          Edit Dosen
        </VCardTitle>

        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="12"
            >
              <VTextField
                v-model="selectedDosen.nama"
                label="Nama"
                outlined
                dense
              />
            </VCol>
            <VCol
              cols="12"
              md="12"
            >
              <VTextField
                v-model="selectedDosen.org"
                label="Kode Fakultas"
                outlined
                dense
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="ma-n3">
          <!-- <VSpacer /> -->
          <VCol
            cols="12"
            class="d-flex flex-wrap justify-center gap-2"
          >
            <VBtn
              class="bg-warning"
              color="white"
              variant="tonal"
              @click="saveChanges"
            >
              Save
            </VBtn>
            <VBtn
              color="primary"
              variant="outlined"
              @click="dialogEdit = false"
            >
              Cancel
            </VBtn>
          </VCol>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog untuk Konfirmasi Delete -->
    <VDialog
      v-model="dialogDelete"
      persistent
      :max-width="$vuetify.display.smAndDown ? 'auto' : 400"
    >
      <!-- 👉 dialog close btn -->
      <DialogCloseBtn
        variant="text"
        size="default"
        @click="dialogDelete = false"
      />

      <VCard class="pa-sm-5 pa-3">
        <VCardTitle class="text-center pb-5 text-h4">
          Konfirmasi Hapus
        </VCardTitle>
        <VCardText class="text-justify">
          <p>Apakah Anda yakin ingin menghapus dosen dengan nama "{{ selectedDosen?.nama }}"?</p>
        </VCardText>

        <VCardActions class="ma-n3">
          <!-- <VSpacer /> -->
          <VCol
            cols="12"
            class="d-flex flex-wrap justify-center gap-2"
          >
            <VBtn
              class="bg-error"
              color="white"
              variant="tonal"
              @click="deleteDosen"
            >
              Hapus
            </VBtn>
            <VBtn
              color="primary"
              variant="outlined"
              @click="dialogDelete = false"
            >
              Batal
            </VBtn>
          </VCol>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>

  <div v-else>
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="7"
          sm="12"
        >
          <VBtn
            v-if="isAuthenticated == false"
            class="bg-error ml-2 mr-2"
            prepend-icon="ri-user-follow-line"
          >
            Not Connected
          </VBtn>
        </VCol>

        <VCol
          cols="12"
          md="5"
          sm="12"
        >
          <VTextField
            v-model="search"
            label="Search"
            placeholder="Search ..."
            append-inner-icon="ri-search-line"
            single-line
            hide-details
            dense
            outlined
          />
        </VCol>
      </VRow>
    </VCardText>

    <!-- 👉 Data Table  -->
    <VDataTable
      :headers="headers"
      :items="productList || []"
      :search="search"
      :items-per-page="10"
      class="text-no-wrap"
    >
      <!-- product -->
      <template #item.product.name="{ item }">
        <div class="d-flex align-center">
          <div>
            <VImg
              :src="item.product.image"
              height="40"
              width="40"
            />
          </div>
          <div class="d-flex flex-column ms-3">
            <span class="d-block font-weight-medium text-truncate text-high-emphasis">{{ item.product.name }}</span>
            <span class="text-xs">{{ item.product.brand }}</span>
          </div>
        </div>
      </template>

      <!-- category -->
      <template #item.product.category="{ item }">
        <div class="d-flex align-center">
          <VAvatar
            v-for="(category, index) in categoryIconFilter(item.product.category)"
            :key="index"
            size="26"
            :color="category.color"
            variant="tonal"
          >
            <VIcon
              size="18"
              :color="category.color"
              class="rounded-0"
            >
              {{ category.icon }}
            </VIcon>
          </VAvatar>
          <span class="ms-1 text-no-wrap">{{ item.product.category }}</span>
        </div>
      </template>

      <!-- buyer -->
      <template #item.buyer.name="{ item }">
        <div class="d-flex align-center">
          <VAvatar
            size="1.875rem"
            :color="!item.buyer.avatar ? 'primary' : undefined"
            :variant="!item.buyer.avatar ? 'tonal' : undefined"
          >
            <VImg
              v-if="item.buyer.avatar"
              :src="item.buyer.avatar"
            />
            <span
              v-else
              class="text-sm"
            >{{ item.buyer.name.slice(0, 2).toUpperCase() }}</span>
          </VAvatar>
          <span class="text-no-wrap font-weight-medium text-high-emphasis ms-2">{{ item.buyer.name }}</span>
        </div>
      </template>

      <!-- Payment -->
      <template #item.payment="{ item }">
        <div class="d-flex flex-column">
          <div class="d-flex align-center">
            <span class="text-high-emphasis font-weight-medium">${{ item.payment.paidAmount }}</span>
            <span v-if="item.payment.paidAmount !== item.payment.total">/{{ item.payment.total }}</span>
          </div>
          <span class="text-xs text-no-wrap">{{ item.payment.receivedPaymentStatus }}</span>
        </div>
      </template>

      <!-- Status -->
      <template #item.status="{ item }">
        <VChip
          :color="resolveStatusColor(item.payment.status)"
          :class="`text-${resolveStatusColor(item.payment.status)}`"
          size="small"
          class="font-weight-medium"
        >
          {{ item.payment.status }}
        </VChip>
      </template>

      <!-- Delete -->
      <template #item.delete="{ item }">
        <IconBtn
          size="small"
          @click="deleteItem(item.product.id)"
        >
          <VIcon icon="ri-delete-bin-line" />
        </IconBtn>
      </template>
    </VDataTable>
  </div>
</template>
