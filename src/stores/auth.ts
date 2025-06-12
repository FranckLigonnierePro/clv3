import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  signInWithEmail, 
  signInWithGoogle, 
  signUpWithEmail, 
  signOut, 
  getCurrentUser,
  getSession,
  type AuthUser,
  type AuthSession
} from '@/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const session = ref<AuthSession | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.user_metadata?.role === 'admin' || false)

  // Initialiser l'utilisateur
  const init = async () => {
    try {
      isLoading.value = true
      const sessionData = await getSession()
      session.value = sessionData
      
      if (sessionData?.user) {
        user.value = sessionData.user
      }
      
      return { user: user.value, session: session.value }
    } catch (err) {
      console.error('Failed to initialize auth:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Connexion avec email/mot de passe
  const loginWithEmail = async (email: string, password: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const { user: authUser, session: authSession } = await signInWithEmail(email, password)
      
      user.value = authUser
      session.value = authSession
      
      return { user: authUser, session: authSession }
    } catch (err: any) {
      console.error('Login error:', err)
      error.value = err.message || 'Échec de la connexion'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Inscription avec email/mot de passe
  const registerWithEmail = async (email: string, password: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const { user: authUser, session: authSession } = await signUpWithEmail(email, password)
      
      user.value = authUser
      session.value = authSession
      
      return { user: authUser, session: authSession }
    } catch (err: any) {
      console.error('Registration error:', err)
      error.value = err.message || "Échec de l'inscription"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Connexion avec Google
  const loginWithGoogle = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      await signInWithGoogle()
      
      // L'utilisateur sera redirigé par le callback de Supabase
      // et l'état sera mis à jour par l'écouteur d'événements dans App.vue
    } catch (err: any) {
      console.error('Google login error:', err)
      error.value = err.message || 'Échec de la connexion avec Google'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Déconnexion
  const logout = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      await signOut()
      
      // Réinitialiser l'état
      user.value = null
      session.value = null
      
      return true
    } catch (err: any) {
      console.error('Logout error:', err)
      error.value = err.message || 'Échec de la déconnexion'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Mettre à jour les informations de l'utilisateur
  const updateUser = (updatedUser: AuthUser | null) => {
    user.value = updatedUser
  }

  // Mettre à jour la session
  const updateSession = (updatedSession: AuthSession | null) => {
    session.value = updatedSession
  }

  return {
    // State
    user,
    session,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    isAdmin,
    
    // Actions
    init,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    updateUser,
    updateSession
  }
})

// Type pour l'utilisation avec useStore()
export type AuthStore = ReturnType<typeof useAuthStore>
