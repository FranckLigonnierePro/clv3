<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { onAuthStateChange, type AuthSession } from './supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isLoading = ref(true)

// Chemins publics qui ne nécessitent pas d'authentification
const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password']

// Vérifier si la route actuelle est publique
const isPublicPath = (path: string) => {
  return publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  )
}

// Initialiser l'authentification
const initAuth = async () => {
  try {
    await authStore.init()
    
    // Rediriger si nécessaire après l'initialisation
    if (authStore.isAuthenticated && isPublicPath(route.path)) {
      // Si l'utilisateur est connecté et sur une page publique, rediriger vers le tableau de bord
      const redirectPath = route.query.redirect as string || '/dashboard'
      router.push(redirectPath)
    } else if (!authStore.isAuthenticated && !isPublicPath(route.path)) {
      // Si l'utilisateur n'est pas connecté et tente d'accéder à une page protégée
      router.push({ 
        path: '/login',
        query: { redirect: route.fullPath }
      })
    }
  } catch (error) {
    console.error('Authentication initialization error:', error)
  } finally {
    isLoading.value = false
  }
}

// Écouter les changements d'authentification
const setupAuthListener = () => {
  const { data: { subscription } } = onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session)
    
    // Mettre à jour le store avec les nouvelles informations de session
    authStore.updateSession(session)
    
    if (event === 'SIGNED_IN') {
      // Mettre à jour l'utilisateur après une connexion réussie
      const { data } = await authStore.init()
      
      // Rediriger si nécessaire
      if (isPublicPath(route.path)) {
        const redirectPath = route.query.redirect as string || '/dashboard'
        router.push(redirectPath)
      }
    } else if (event === 'SIGNED_OUT') {
      // Rediriger vers la page de connexion si l'utilisateur est déconnecté
      // et se trouve sur une page protégée
      if (!isPublicPath(route.path)) {
        router.push({ 
          path: '/login',
          query: { redirect: route.fullPath }
        })
      }
    }
  })
  
  return () => {
    subscription.unsubscribe()
  }
}

// Configuration initiale
onMounted(async () => {
  try {
    // Configurer l'écouteur d'événements d'authentification
    const cleanup = setupAuthListener()
    
    // Initialiser l'authentification
    await initAuth()
    
    // Nettoyer l'écouteur d'événements lors du démontage du composant
    return () => {
      cleanup()
    }
  } catch (error) {
    console.error('Error setting up auth listener:', error)
    isLoading.value = false
  }
})

// Surveiller les changements de route pour la protection des routes
watch(
  () => route.path,
  async (toPath) => {
    if (isLoading.value) return
    
    const isAuthRequired = !isPublicPath(toPath)
    
    if (isAuthRequired && !authStore.isAuthenticated) {
      // Rediriger vers la page de connexion avec une redirection de retour
      router.push({
        path: '/login',
        query: { redirect: toPath }
      })
    } else if (!isAuthRequired && authStore.isAuthenticated && toPath === '/login') {
      // Rediriger depuis la page de connexion si déjà connecté
      const redirectPath = route.query.redirect as string || '/dashboard'
      router.push(redirectPath)
    }
  }
)
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Écran de chargement -->
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="mt-4 text-gray-600">Chargement...</p>
      </div>
    </div>
    
    <!-- Contenu principal -->
    <RouterView v-else />
    
    <!-- Notifications (à implémenter) -->
    <div id="notifications" class="fixed bottom-4 right-4 z-50 space-y-2"></div>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
}
</style>