<template>
  <AuthLayout>
    <template #title>Connexion à votre compte</template>
    <template #subtitle>
      Ou 
      <router-link 
        to="/auth/register" 
        class="font-medium text-blue-600 hover:text-blue-500"
      >
        créez un nouveau compte
      </router-link>
    </template>
    
    <!-- Formulaire de connexion -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="space-y-4">
        <!-- Champ email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Adresse e-mail
          </label>
          <div class="mt-1">
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              :class="{ 'border-red-300 text-red-900': formErrors.email }"
            >
            <p v-if="formErrors.email" class="mt-2 text-sm text-red-600">
              {{ formErrors.email }}
            </p>
          </div>
        </div>

        <!-- Champ mot de passe -->
        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <div class="text-sm">
              <router-link 
                to="/auth/forgot-password" 
                class="font-medium text-blue-600 hover:text-blue-500"
              >
                Mot de passe oublié ?
              </router-link>
            </div>
          </div>
          <div class="mt-1">
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              :class="{ 'border-red-300 text-red-900': formErrors.password }"
            >
            <p v-if="formErrors.password" class="mt-2 text-sm text-red-600">
              {{ formErrors.password }}
            </p>
          </div>
        </div>
      </div>

      <!-- Bouton de soumission -->
      <div>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!isSubmitting">Se connecter</span>
          <svg v-else class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </div>
    </form>

    <!-- Séparateur -->
    <template #social>
      <!-- Bouton Google -->
      <button
        @click="signInWithGoogle"
        type="button"
        class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.059 -9.424 56.159 -10.784 56.849 L -10.784 61.529 L -6.816 61.529 C -4.416 59.339 -3.264 55.729 -3.264 51.509 Z"/>
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.816 61.529 L -10.784 56.849 C -11.764 57.339 -12.974 57.629 -14.254 57.629 C -17.204 57.629 -19.704 55.649 -20.614 52.919 L -24.692 52.939 C -22.722 58.649 -19.134 63.239 -14.754 63.239 Z"/>
            <path fill="#FBBC05" d="M -20.614 52.919 C -20.894 52.119 -21.034 51.259 -21.034 50.369 C -21.034 49.479 -20.884 48.629 -20.614 47.829 L -20.614 43.109 L -24.692 43.109 C -25.622 44.939 -26.134 46.999 -26.134 49.109 C -26.134 51.219 -25.622 53.279 -24.692 55.109 L -20.614 52.919 Z"/>
            <path fill="#EA4335" d="M -14.754 40.479 C -12.984 40.469 -11.354 41.089 -10.024 42.139 L -6.824 38.999 C -8.784 37.239 -11.614 36.239 -14.754 36.259 C -19.134 36.259 -22.722 40.849 -24.692 46.549 L -20.614 48.739 C -19.704 45.999 -17.204 44.009 -14.754 44.009 C -13.474 44.009 -12.264 44.299 -11.284 44.789 L -11.284 48.469 C -12.254 47.789 -13.464 47.389 -14.754 47.389 C -12.244 47.389 -10.194 49.119 -9.42451 51.399 L -5.4445 51.399 C -6.3245 47.659 -10.194 44.729 -14.754 44.729 Z"/>
          </g>
        </svg>
        Google
      </button>
      
      <!-- Bouton GitHub -->
      <button
        @click="signInWithGithub"
        type="button"
        class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
        </svg>
        GitHub
      </button>
    </template>
    
    <!-- Lien d'inscription pour mobile -->
    <template #mobile-footer>
      <p class="text-gray-600">
        Pas encore de compte ? 
        <router-link to="/auth/register" class="font-medium text-blue-600 hover:text-blue-500">
          S'inscrire
        </router-link>
      </p>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Mail, Lock, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// État du formulaire
const form = reactive({
  email: '',
  password: ''
})

// Erreurs de validation
const formErrors = reactive({
  email: '',
  password: ''
})

// État de soumission
const isSubmitting = ref(false)

// Valider le formulaire
const validateForm = () => {
  let isValid = true
  
  // Réinitialiser les erreurs
  Object.keys(formErrors).forEach(key => {
    formErrors[key] = ''
  })
  
  // Validation de l'email
  if (!form.email) {
    formErrors.email = 'L\'adresse e-mail est requise'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    formErrors.email = 'Veuillez entrer une adresse e-mail valide'
    isValid = false
  }
  
  // Validation du mot de passe
  if (!form.password) {
    formErrors.password = 'Le mot de passe est requis'
    isValid = false
  } else if (form.password.length < 6) {
    formErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    isValid = false
  }
  
  return isValid
}

// Soumettre le formulaire
const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    isSubmitting.value = true
    await authStore.login(form.email, form.password)
    
    // Rediriger vers la page demandée ou le tableau de bord
    const redirectTo = typeof route.query.redirect === 'string' 
      ? route.query.redirect 
      : '/dashboard'
    
    router.push(redirectTo)
  } catch (error) {
    // Les erreurs sont gérées par le store d'authentification
    console.error('Erreur de connexion:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Connexion avec Google
const signInWithGoogle = async () => {
  try {
    await authStore.signInWithGoogle()
    // La redirection est gérée par le store d'authentification
  } catch (error) {
    console.error('Erreur de connexion avec Google:', error)
  }
}

// Connexion avec GitHub
const signInWithGithub = async () => {
  try {
    await authStore.signInWithGithub()
    // La redirection est gérée par le store d'authentification
  } catch (error) {
    console.error('Erreur de connexion avec GitHub:', error)
  }
}

// Vérifier si un message d'erreur est présent dans l'URL
onMounted(() => {
  if (route.query.error) {
    // Les erreurs sont affichées via le composant AuthLayout
    console.error('Erreur d\'authentification:', route.query.error)
  }
})
</script>
