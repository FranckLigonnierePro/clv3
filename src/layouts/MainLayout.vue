<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useRoute, RouterView } from "vue-router";
import AppNavbar from "@/components/layout/AppNavbar.vue";

const route = useRoute();
const showNavbar = ref(true);

// Cacher la navbar sur certaines routes
watch(
  () => route.path,
  (newPath) => {
    // Liste des routes où la navbar doit être masquée (par exemple, la page de lecture vidéo)
    const hideNavbarPaths = ["/watch/", "/embed/"];
    showNavbar.value = !hideNavbarPaths.some((path) =>
      newPath.startsWith(path),
    );
  },
  { immediate: true },
);

</script>

<template>
    <!-- Barre de navigation -->
    <AppNavbar v-if="showNavbar" />
    <RouterView />
</template>

<style scoped>
.main-layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
