<script setup lang="ts">
import { useKeycloakStore } from '@/@core/stores/keycloakStore';
import OurStaff from '@/views/dstipro/staf/OurStaff.vue';
import OurStaffTable from '@/views/dstipro/staf/OurStaffTable.vue';
import academyCourseIllustration1 from '@images/pages/academy-course-illustration1.png';
import academyCourseIllustration2Dark from '@images/pages/academy-course-illustration2-dark.png';
import academyCourseIllustration2Light from '@images/pages/academy-course-illustration2-light.png';

const keycloakStore = useKeycloakStore();
// Gunakan computed agar selalu reaktif
const isAuthenticated = computed(() => keycloakStore.authenticated);

const academyCourseIllustration2 = useGenerateImageVariant(academyCourseIllustration2Light, academyCourseIllustration2Dark)

const searchQuery = ref('')
</script>

<template>
  <div>
    <VCard class="mb-6">
      <VCardText class="py-12 position-relative">
        <div class="d-flex flex-column gap-y-4 mx-auto" :class="$vuetify.display.mdAndUp ? 'w-50' : 'w-100'">
          <h4 class="text-h4 text-center text-wrap mx-auto" :class="$vuetify.display.mdAndUp ? 'w-75' : 'w-100'">
            Our DSTI Staff. <span class="text-primary"> All in one place.</span>
          </h4>
          <p class="text-center text-wrap text-body-1 mx-auto mb-0">
            Grow your skill with the most reliable online courses and certifications in marketing, information
            technology, programming, and data science.
          </p>
          <div class="d-flex justify-center align-center gap-x-4">
            <VTextField v-model="searchQuery" density="compact" placeholder="Find Our Staff"
              style="max-inline-size: 400px;" clearable @click:clear="searchQuery = ''" />
            <VBtn color="primary" icon="ri-search-line" class="rounded" />
          </div>
          <VBtn v-if="!isAuthenticated" class="bg-error" prepend-icon="ri-user-follow-line">
            Not Connected
          </VBtn>
        </div>
        <img :src="academyCourseIllustration1" class="illustration1 d-none d-md-block flip-in-rtl" height="180">
        <img :src="academyCourseIllustration2" class="illustration2 d-none d-md-block" height="100">
      </VCardText>
    </VCard>

    <OurStaff v-if="!isAuthenticated" :search-query="searchQuery" />
    <OurStaffTable v-if="isAuthenticated" :search-query="searchQuery" />
  </div>
</template>

<style lang="scss">
.illustration1 {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
}

.illustration2 {
  position: absolute;
  inset-block-start: 2rem;
  inset-inline-start: 2.5rem;
}
</style>
