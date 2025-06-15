<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="py-4 shadow-sm bg-white">
      <div class="container mx-auto px-4 flex items-center justify-between">
        <RouterLink to="/" class="text-xl font-bold text-blue-600"
          >ClipLive</RouterLink
        >
        <RouterLink to="/" class="text-sm text-gray-600 hover:text-gray-900"
          >Retour à l'accueil</RouterLink
        >
      </div>
    </header>

    <!-- Main -->
    <main class="flex-1 flex items-center justify-center py-10 px-4">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>
