<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'

const route = useRoute()
const isLoading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

// Gérer les messages d'erreur et de succès depuis les paramètres de requête
watch(() => route.query, (query) => {
  if (query.error) {
    error.value = Array.isArray(query.error) ? query.error[0] : query.error
  }
  if (query.success) {
    success.value = Array.isArray(query.success) ? query.success[0] : query.success
  }
  
  // Effacer les messages après 5 secondes
  if (error.value || success.value) {
    setTimeout(() => {
      error.value = null
      success.value = null
      // Nettoyer l'URL sans recharger la page
      window.history.replaceState({}, document.title, window.location.pathname)
    }, 5000)
  }
}, { immediate: true })

// Méthodes pour gérer l'état de chargement
const startLoading = () => {
  isLoading.value = true
  error.value = null
}

const stopLoading = () => {
  isLoading.value = false
}

const setError = (message: string) => {
  error.value = message
  stopLoading()
}

const setSuccess = (message: string) => {
  success.value = message
  stopLoading()
}

// Exposer les méthodes et états au template
const context = {
  isLoading,
  error,
  success,
  startLoading,
  stopLoading,
  setError,
  setSuccess
}

defineExpose(context)
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <!-- En-tête -->
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <router-link to="/">
        <img
          class="mx-auto h-12 w-auto"
          src="/logo.svg"
          alt="ClipLive"
        />
      </router-link>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        <slot name="title">
          {{ $route.meta.title || 'Bienvenue' }}
        </slot>
      </h2>
      <p v-if="$slots.subtitle" class="mt-2 text-center text-sm text-gray-600">
        <slot name="subtitle"></slot>
      </p>
    </div>

    <!-- Contenu principal -->
    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Messages d'erreur et de succès -->
      <div v-if="error || success" class="mb-4">
        <div 
          v-if="error"
          class="bg-red-50 border-l-4 border-red-400 p-4 rounded-md"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <XCircle class="h-5 w-5 text-red-400" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700">
                {{ error }}
              </p>
            </div>
          </div>
        </div>
        
        <div 
          v-else-if="success"
          class="bg-green-50 border-l-4 border-green-400 p-4 rounded-md"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <CheckCircle class="h-5 w-5 text-green-400" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-green-700">
                {{ success }}
              </p>
            </div>
          </div>
        </div>
      </div>

      
      <!-- Carte du formulaire -->
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- État de chargement -->
        <div v-if="isLoading" class="text-center py-8">
          <Loader2 class="mx-auto h-8 w-8 text-blue-500 animate-spin" />
          <p class="mt-2 text-sm text-gray-600">Traitement en cours...</p>
        </div>
        
        <!-- Contenu du formulaire -->
        <template v-else>
          <slot v-bind="context"></slot>
        </template>
      </div>
      
      <!-- Liens supplémentaires -->
      <div v-if="$slots.links" class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">
              <slot name="links"></slot>
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pied de page -->
    <div class="mt-8 text-center text-sm text-gray-500">
      <p>
        &copy; {{ new Date().getFullYear() }} ClipLive. Tous droits réservés.
      </p>
      <div class="mt-2">
        <router-link 
          to="/privacy" 
          class="text-blue-600 hover:text-blue-500"
        >
          Confidentialité
        </router-link>
        <span class="mx-2">•</span>
        <router-link 
          to="/terms" 
          class="text-blue-600 hover:text-blue-500"
        >
          Conditions d'utilisation
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles spécifiques au layout d'authentification */
</style>
