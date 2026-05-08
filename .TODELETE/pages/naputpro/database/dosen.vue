<script setup lang="ts">
import tableDosen from '@/views/dstipro/database/dosen.vue';
</script>

<template>
  <VRow>
    <!-- 👉 Tabel Dosen  -->
    <VCol cols="12">
      <VCard title="List Dosen UI" class="listdosen">
        <tableDosen />
      </VCard>
    </VCol>
  </VRow>
</template>
