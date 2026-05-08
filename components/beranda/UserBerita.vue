<script setup lang="ts">
import { useKeycloakStore } from '@/@core/stores/keycloakStore'
import type { Data } from '@/plugins/datatable/types'
import data from '@/views/demos/forms/tables/data-table/datatable'

const keycloakStore = useKeycloakStore()

// Gunakan computed agar selalu reaktif
const isAuthenticated = computed(() => keycloakStore.authenticated)

const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<Data>({
  responsiveId: '',
  id: -1,
  avatar: '',
  fullName: '',
  post: '',
  email: '',
  city: '',
  startDate: '',
  salary: -1,
  age: '',
  experience: '',
  status: -1,
})

const editedItem = ref<Data>(defaultItem.value)
const editedIndex = ref(-1)
const userList = ref<Data[]>([])

// status options
const selectedOptions = [
  { text: 'Current', value: 1 },
  { text: 'Professional', value: 2 },
  { text: 'Rejected', value: 3 },
  { text: 'Resigned', value: 4 },
  { text: 'Applied', value: 5 },
]

// headers
const headers = [
  { title: 'NAME', key: 'fullName' },
  { title: 'EMAIL', key: 'email' },
  { title: 'DATE', key: 'startDate' },
  { title: 'SALARY', key: 'salary' },
  { title: 'AGE', key: 'age' },
  { title: 'STATUS', key: 'status' },
  { title: 'ACTIONS', key: 'actions' },
]

const resolveStatusVariant = (status: number) => {
  if (status === 1)
    return { color: 'primary', text: 'Current' }
  else if (status === 2)
    return { color: 'success', text: 'Professional' }
  else if (status === 3)
    return { color: 'error', text: 'Rejected' }
  else if (status === 4)
    return { color: 'warning', text: 'Resigned' }
  else
    return { color: 'info', text: 'Applied' }
}

// 👉 methods
const editItem = (item: Data) => {
  editedIndex.value = userList.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: Data) => {
  editedIndex.value = userList.value.indexOf(item)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const save = () => {
  if (editedIndex.value > -1)
    Object.assign(userList.value[editedIndex.value], editedItem.value)

  else
    userList.value.push(editedItem.value)

  close()
}

const deleteItemConfirm = () => {
  userList.value.splice(editedIndex.value, 1)
  closeDelete()
}

onMounted(() => {
  userList.value = JSON.parse(JSON.stringify(data))
})

// Table headers
const headersapi: Header[] = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Judul', key: 'title', sortable: true },

  // { title: 'Isi', key: 'body', sortable: false, width: '40%' },
  { title: 'Tag', key: 'tags', sortable: false },
  { title: 'Reaksi', key: 'reactions', sortable: false },
  { title: 'Aksi', key: 'operation' },
]

// State management
const items = ref<Post[]>([])
const searchText = ref('')
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const modalMode = ref<'add' | 'edit' | 'view'>('add')
const selectedPost = ref<Post | null>(null)

// Interface for the API data
interface Post {
  id: number
  title: string // Post title
  body: string // Post content
  tags: string[] // Tags
  reactions: { likes: number; dislikes: number } // Reactions
  views: number // Views count
  userId: number // Author user ID
}

// Computed to filter items based on the search query
const filteredItems = computed(() => {
  if (!searchText.value)
    return items.value
  const query = searchText.value.toLowerCase()

  return items.value.filter(item =>
    [item.id, item.title, item.body, item.tags.join(', '), item.userId]
      .map(field => String(field).toLowerCase())
      .some(field => field.includes(query)),
  )
})

// Fetch data from API
onMounted(() => {
  getData()
})

async function getData() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('https://dummyjson.com/posts')
    if (!response.ok)
      throw new Error('Gagal mengambil data')
    const data = await response.json()

    items.value = data.posts.map((post: any) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      tags: post.tags,
      reactions: post.reactions,
      views: post.views,
      userId: post.userId,
    }))
  }
  catch (err: any) {
    error.value = err.message || 'Terjadi kesalahan saat mengambil data'
  }
  finally {
    loading.value = false
  }
}

// property untuk menangani tags sebagai string
const selectedPostTags = computed({
  get() {
    return selectedPost.value?.tags.join(', ') || ''
  },
  set(value: string) {
    if (selectedPost.value)
      selectedPost.value.tags = value.split(',').map(tag => tag.trim())
  },
})

// CRUD Operations
function openModal(mode: 'add' | 'edit' | 'view', post: Post | null = null) {
  modalMode.value = mode
  selectedPost.value = post
    ? { ...post }
    : { id: Date.now(), title: '', body: '', tags: [], reactions: { likes: 0, dislikes: 0 }, views: 0, userId: 0 }
  showModal.value = true
}

function savePost() {
  if (modalMode.value === 'add') {
    items.value.push({ ...selectedPost.value! })
  }
  else if (modalMode.value === 'edit') {
    const index = items.value.findIndex(s => s.id === selectedPost.value!.id)
    if (index > -1)
      items.value[index] = { ...selectedPost.value! }
  }
  showModal.value = false
}

function confirmDelete(post: Post) {
  selectedPost.value = post
  showDeleteModal.value = true
}

function deletePost() {
  if (selectedPost.value) {
    const index = items.value.findIndex(s => s.id === selectedPost.value!.id)
    if (index > -1)
      items.value.splice(index, 1)
  }
  showDeleteModal.value = false
}
</script>

<template>
  <div v-if="isAuthenticated">
    <VRow>
      <VCol cols="12">
        <VCard
          title="News"
          class="news"
        >
          <VCardText class="d-flex align-center flex-wrap gap-4">
            <VRow>
              <VCol
                cols="12"
                md="8"
                sm="12"
              >
                <VBtn
                  prepend-icon="ri-add-line"
                  class="bg-primary"
                  color="white"
                  @click="openModal('add')"
                >
                  Tambah Data
                </VBtn>
              </VCol>

              <VCol
                cols="12"
                md="4"
                sm="12"
              >
                <VTextField
                  v-model="searchText"
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

          <!-- 👉 Data Table API  -->
          <VDataTable
            :headers="headersapi"
            :items="filteredItems || []"
            :search="searchText"
            :items-per-page="10"
            class="text-no-wrap"
          >
            <template #item.reactions="{ item }">
              ❤️: {{ item.reactions.likes }}, 🚫: {{ item.reactions.dislikes }}
            </template>

            <template #item.operation="{ item }">
              <VBtn
                color="info"
                size="small"
                icon
                @click="openModal('view', item)"
              >
                <VIcon icon="ri-eye-line" />
              </VBtn>
              <VBtn
                color="warning"
                size="small"
                icon
                @click="openModal('edit', item)"
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
            </template>
          </VDataTable>

          <!-- Modal for Add/Edit/View -->
          <VDialog
            v-model="showModal"
            persistent
            :max-width="$vuetify.display.smAndDown ? 'auto' : 500"
          >
            <!-- 👉 dialog close btn -->
            <DialogCloseBtn
              variant="text"
              size="default"
              @click="showModal = false"
            />

            <VCard class="pa-sm-3 pa-3">
              <VCardTitle class="text-center pb-5 text-h4">
                {{ modalMode === 'add' ? 'Tambah Data' : modalMode === 'edit' ? 'Edit Data' : 'Detail Data' }}
              </VCardTitle>

              <VCardText>
                <VRow>
                  <VCol
                    cols="12"
                    md="12"
                  >
                    <VTextField
                      v-model="selectedPost.title"
                      label="Judul"
                      dense
                      :readonly="modalMode === 'view'"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="12"
                  >
                    <VTextarea
                      v-model="selectedPost.body"
                      label="Isi"
                      dense
                      :readonly="modalMode === 'view'"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="12"
                  >
                    <VTextField
                      v-model="selectedPostTags"
                      label="Tag"
                      dense
                      :readonly="modalMode === 'view'"
                    />
                  </VCol>
                </VRow>
              </VCardText>

              <VCardActions>
                <VSpacer />
                <VBtn
                  variant="outlined"
                  @click="showModal = false"
                >
                  Batal
                </VBtn>
                <VBtn
                  v-if="modalMode !== 'view'"
                  class="bg-success"
                  color="white"
                  variant="tonal"
                  @click="savePost"
                >
                  Simpan
                </VBtn>
              </VCardActions>
            </VCard>
          </VDialog>

          <!-- Modal for Delete Confirmation -->
          <VDialog
            v-model="showDeleteModal"
            persistent
            :max-width="$vuetify.display.smAndDown ? 'auto' : 400"
          >
            <!-- 👉 dialog close btn -->
            <DialogCloseBtn
              variant="text"
              size="default"
              @click="showDeleteModal = false"
            />

            <VCard class="pa-sm-7 pa-3">
              <VCardTitle class="text-center pb-5 text-h4">
                Konfirmasi Hapus
              </VCardTitle>
              <VCardText class="text-justify">
                Apakah Anda yakin ingin menghapus data <strong>{{ selectedPost?.title }}</strong>?
              </VCardText>

              <VCardActions class="ma-n3">
                <VSpacer />
                <VBtn
                  variant="outlined"
                  @click="showDeleteModal = false"
                >
                  Batal
                </VBtn>
                <VBtn
                  variant="tonal"
                  class="bg-error"
                  color="white"
                  @click="deletePost"
                >
                  Hapus
                </VBtn>
              </VCardActions>
            </VCard>
          </VDialog>
        </VCard>
      </VCol>
    </VRow>
  </div>

  <div v-else>
    <VRow>
      <VCol cols="12">
        <VCard
          title="News"
          class="news"
        >
          <!-- 👉 Datatable  -->
          <VDataTable
            :headers="headers"
            :items="userList"
            :items-per-page="5"
            class="text-no-wrap"
          >
            <!-- full name -->
            <template #item.fullName="{ item }">
              <div class="d-flex align-center">
                <!-- avatar -->
                <VAvatar
                  size="32"
                  :color="item.avatar ? '' : 'primary'"
                  :class="item.avatar ? '' : 'v-avatar-light-bg primary--text'"
                  :variant="!item.avatar ? 'tonal' : undefined"
                >
                  <VImg
                    v-if="item.avatar"
                    :src="item.avatar"
                  />
                  <span
                    v-else
                    class="text-sm"
                  >{{ avatarText(item.fullName) }}</span>
                </VAvatar>

                <div class="d-flex flex-column ms-3">
                  <span class="d-block font-weight-medium text-high-emphasis text-truncate">{{ item.fullName }}</span>
                  <small>{{ item.post }}</small>
                </div>
              </div>
            </template>

            <!-- status -->
            <template #item.status="{ item }">
              <VChip
                :color="resolveStatusVariant(item.status).color"
                density="comfortable"
              >
                {{ resolveStatusVariant(item.status).text }}
              </VChip>
            </template>

            <!-- Actions -->
            <template #item.actions="{ item }">
              <div class="d-flex gap-1">
                <IconBtn
                  size="small"
                  @click="editItem(item)"
                >
                  <VIcon icon="ri-pencil-line" />
                </IconBtn>
                <IconBtn
                  size="small"
                  @click="deleteItem(item)"
                >
                  <VIcon icon="ri-delete-bin-line" />
                </IconBtn>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VCol>
    </VRow>

    <!-- 👉 Edit Dialog  -->
    <VDialog
      v-model="editDialog"
      max-width="600px"
    >
      <VCard title="Edit Item">
        <VCardText>
          <div class="text-body-1 mb-6">
            Name: <span class="text-h6">{{ editedItem?.fullName }}</span>
          </div>
          <VRow>
            <!-- fullName -->
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="editedItem.fullName"
                label="User name"
              />
            </VCol>

            <!-- email -->
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="editedItem.email"
                label="Email"
              />
            </VCol>

            <!-- salary -->
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="editedItem.salary"
                label="Salary"
                prefix="$"
                type="number"
              />
            </VCol>

            <!-- age -->
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="editedItem.age"
                label="Age"
                type="number"
              />
            </VCol>

            <!-- start date -->
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="editedItem.startDate"
                label="Date"
              />
            </VCol>

            <!-- status -->
            <VCol
              cols="12"
              sm="6"
            >
              <VSelect
                v-model="editedItem.status"
                :items="selectedOptions"
                item-title="text"
                item-value="value"
                label="Standard"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="self-align-end d-flex gap-4 justify-end">
            <VBtn
              color="error"
              variant="outlined"
              @click="close"
            >
              Cancel
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="save"
            >
              Save
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- 👉 Delete Dialog  -->
    <VDialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Are you sure you want to delete this item?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeDelete"
            >
              Cancel
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteItemConfirm"
            >
              OK
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
