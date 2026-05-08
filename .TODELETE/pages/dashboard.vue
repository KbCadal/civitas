<script setup lang="ts">
import { useKeycloakStore } from "@/@core/stores/keycloakStore";
import { onMounted } from 'vue';

onMounted(() => {
  keycloakStore.refresh();
});

const keycloakStore = useKeycloakStore();
</script>

<template>
  <div>
    <h1>Welcome, {{ keycloakStore.name }}</h1>
  </div>
</template>
