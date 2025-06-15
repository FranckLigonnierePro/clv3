<template>
  <div
    class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        403 - Accès refusé
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div class="text-center">
          <svg
            class="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 class="mt-2 text-lg font-medium text-gray-900">
            Accès non autorisé
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            Vous devez être connecté avec les droits d'administration pour
            accéder à cette page.
          </p>
          <div class="mt-6 space-y-4">
            <router-link
              to="/auth/login"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Se connecter
            </router-link>
            <router-link
              to="/"
              class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Retour à l'accueil
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Unauthorized",
  metaInfo: {
    title: "Accès non autorisé",
  },
});
</script>

<style scoped>
/* Add any custom styles here */
</style>
