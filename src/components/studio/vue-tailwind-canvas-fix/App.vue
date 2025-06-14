<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { ref, onMounted, watch, computed } from 'vue'
import { onAuthStateChange, type AuthSession } from './supabase'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/stores/notifications'
import Notification from '@/components/ui/Notification.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isLoading = ref(true)

// Chemins publics qui ne nécessitent pas d'authentification
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify',
  '/404',
  '/unauthorized',
  '/live',
  '/watch'
]

/**
 * Vérifie si un chemin est public (ne nécessite pas d'authentification)
 */
const isPublicPath = (path: string): boolean => {
  if (!path) return false
  
  // Nettoyer le chemin pour enlever les paramètres de requête et les fragments
  const cleanPath = path.split('?')[0].split('#')[0].toLowerCase().trim()
  
  // Vérifier si le chemin correspond exactement à un chemin public
  if (publicPaths.some(p => p.toLowerCase() === cleanPath)) {
    return true
  }
  
  // Vérifier si le chemin commence par un chemin public suivi d'un /
  return publicPaths.some(publicPath => {
    const normalizedPublicPath = publicPath.toLowerCase()
    return (
      cleanPath === normalizedPublicPath ||
      cleanPath.startsWith(`${normalizedPublicPath}/`)
    )
  })
}

/**
 * Initialise l'authentification et gère les redirections initiales
 */
const initAuth = async () => {
  try {
    // Initialiser le store d'authentification
    await authStore.init()
    
    // Si l'utilisateur est connecté
    if (authStore.isAuthenticated) {
      // Ne pas rediriger depuis la page de visionnage
      if (route.path.startsWith('/watch')) {
        return
      }
      
      // Rediriger depuis les autres pages publiques vers le tableau de bord
      if (isPublicPath(route.path) && route.path !== '/') {
        const redirectPath = route.query.redirect as string || '/app/dashboard'
        router.push(redirectPath)
      }
    } 
    // Si l'utilisateur n'est pas connecté et tente d'accéder à une page protégée
    else if (!isPublicPath(route.path)) {
      const redirectPath = route.fullPath === '/' ? undefined : route.fullPath
      router.push({ 
        name: 'login',
        query: redirectPath ? { redirect: redirectPath } : undefined
      })
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'authentification:', error)
    // En cas d'erreur, rediriger vers la page de connexion
    if (!isPublicPath(route.path)) {
      router.push({ name: 'login' })
    }
  } finally {
    isLoading.value = false
  }
}

/**
 * Configure l'écouteur d'événements d'authentification
 */
const setupAuthListener = () => {
  const { data: { subscription } } = onAuthStateChange(async (event, session) => {
    console.log('Changement d\'état d\'authentification:', event)
    
    try {
      // Mettre à jour la session dans le store
      authStore.updateSession(session)
      
      // Gérer les différents événements d'authentification
      switch (event) {
        case 'SIGNED_IN':
          // Mettre à jour l'utilisateur après une connexion réussie
          await authStore.init()
          
          // Ne pas rediriger depuis la page de visionnage
          if (route.path.startsWith('/watch')) {
            console.log('Page de visionnage détectée, pas de redirection')
            return
          }
          
          // Rediriger depuis les autres pages publiques vers le tableau de bord
          if (isPublicPath(route.path) && route.path !== '/') {
            const redirectPath = route.query.redirect as string || '/app/dashboard'
            console.log('Redirection vers:', redirectPath)
            router.push(redirectPath)
          }
          break
          
        case 'SIGNED_OUT':
          // Rediriger vers la page de connexion si sur une page protégée
          if (!isPublicPath(route.path)) {
            router.push({ 
              name: 'login',
              query: { redirect: route.fullPath }
            })
          }
          break
          
        case 'TOKEN_REFRESHED':
          console.log('Token rafraîchi avec succès')
          break
          
        case 'USER_UPDATED':
          console.log('Utilisateur mis à jour:', session?.user)
          break
      }
    } catch (error) {
      console.error('Erreur lors de la gestion du changement d\'état d\'authentification:', error)
    }
  })
  
  // Retourner une fonction de nettoyage
  return () => {
    if (subscription) {
      subscription.unsubscribe()
    }
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

/**
 * Surveille les changements de route pour la protection des routes
 */
watch(
  () => route.fullPath,
  async (toPath, fromPath) => {
    // Ignorer si toujours en cours de chargement initial
    if (isLoading.value) return
    
    // Ignorer si le chemin n'a pas vraiment changé
    if (toPath === fromPath) return
    
    // Nettoyer le chemin pour la vérification
    const cleanPath = toPath.split('?')[0].split('#')[0]
    const isAuthRequired = !isPublicPath(cleanPath)
    
    try {
      // Si l'authentification est requise mais l'utilisateur n'est pas connecté
      if (isAuthRequired && !authStore.isAuthenticated) {
        // Éviter les boucles de redirection
        if (cleanPath !== '/auth/login' && cleanPath !== '/login') {
          await router.push({
            name: 'login',
            query: { redirect: cleanPath }
          })
        }
      } 
      // Si l'utilisateur est connecté mais sur une page d'authentification
      else if (authStore.isAuthenticated && (cleanPath === '/login' || cleanPath === '/auth/login')) {
        const redirectPath = route.query.redirect as string || '/app/dashboard'
        await router.push(redirectPath)
      }
    } catch (error) {
      console.error('Erreur lors de la protection de la route:', error)
      // En cas d'erreur, rediriger vers la page d'accueil
      if (cleanPath !== '/') {
        await router.push('/')
      }
    }
  },
  { immediate: true }
)
// Exposer les notifications pour le template
const notificationsStore = useNotifications()
const notifications = computed(() => notificationsStore.notifications)
</script>

<template>
  <div id="app" class="min-h-screen bg-zinc-950">
    <!-- Conteneur de notifications -->
    <div class="fixed inset-0 z-50 flex flex-col items-end p-4 pointer-events-none">
      <div class="w-full max-w-sm space-y-2">
        <TransitionGroup
          enter-active-class="transform ease-out duration-300 transition"
          enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <Notification
            v-for="notification in notifications"
            :key="notification.id"
            :notification="notification"
            class="pointer-events-auto"
          />
        </TransitionGroup>
      </div>
    </div>

    <!-- Écran de chargement -->
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-40">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="mt-4 text-gray-600">Chargement...</p>
      </div>
    </div>

    <!-- Contenu principal avec Suspense pour le chargement asynchrone -->
    <RouterView v-slot="{ Component }">
      <Suspense>
        <template #default>
          <component :is="Component" v-if="!isLoading" />
        </template>
        <template #fallback>
          <div class="flex items-center justify-center min-h-screen">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </template>
      </Suspense>
    </RouterView>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
}
</style>
<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #app {
  @apply m-0 p-0 h-full overflow-hidden;
}
</style>