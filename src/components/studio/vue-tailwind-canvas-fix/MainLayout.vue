<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'

const route = useRoute()
const showNavbar = ref(true)

// Cacher la navbar sur certaines routes
watch(
  () => route.path,
  (newPath) => {
    // Liste des routes où la navbar doit être masquée (par exemple, la page de lecture vidéo)
    const hideNavbarPaths = ['/watch/', '/embed/']
    showNavbar.value = !hideNavbarPaths.some(path => newPath.startsWith(path))
  },
  { immediate: true }
)

// Debug: Vérifier quand le composant est monté et les propriétés
onMounted(() => {
  console.log('MainLayout monté')
  console.log('Route actuelle:', route.path)
  console.log('showNavbar:', showNavbar.value)
})
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
  <div class="min-h-screen bg-zinc-950 flex flex-col">
    <!-- Barre de navigation -->
    <AppNavbar v-if="showNavbar" />
    
    <!-- Contenu principal -->
    <main class="flex-1 p-4">
      <div class="max-w-7xl mx-auto w-full">
        <!-- RouterView pour le rendu des vues imbriquées -->
            <RouterView />
  </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Styles spécifiques au layout */
</style>
