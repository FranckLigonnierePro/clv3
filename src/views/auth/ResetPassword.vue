<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Réinitialiser le mot de passe
        </h2>
        <p v-if="!success" class="mt-2 text-center text-sm text-gray-600">
          Entrez votre nouveau mot de passe
        </p>
        <p v-else class="mt-2 text-center text-sm text-green-600">
          Votre mot de passe a été réinitialisé avec succès !
        </p>
      </div>
      
      <form v-if="!success" class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div class="mb-4">
            <label for="password" class="sr-only">Nouveau mot de passe</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Nouveau mot de passe"
            >
          </div>
          <div>
            <label for="confirm-password" class="sr-only">Confirmer le mot de passe</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              name="confirm-password"
              type="password"
              autocomplete="new-password"
              required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Confirmer le mot de passe"
            >
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="loading || !passwordsMatch"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg
                v-if="loading"
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </span>
            {{ loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe' }}
          </button>
        </div>
      </form>
      
      <div v-if="success" class="text-center">
        <router-link
          to="/auth/login"
          class="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Retour à la connexion
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '@/supabase';

export default {
  name: 'ResetPassword',
  
  props: {
    accessToken: {
      type: String,
      default: ''
    }
  },
  
  setup(props) {
    const router = useRouter();
    const route = useRoute();
    const password = ref('');
    const confirmPassword = ref('');
    const loading = ref(false);
    const error = ref('');
    const success = ref(false);
    const accessToken = ref('');

    // Check if passwords match
    const passwordsMatch = computed(() => {
      return password.value && password.value === confirmPassword.value;
    });

    // Get access token from URL or props
    onMounted(() => {
      const tokenFromUrl = route.query.access_token;
      accessToken.value = props.accessToken || (Array.isArray(tokenFromUrl) ? tokenFromUrl[0] : tokenFromUrl || '');
    });

    const handleSubmit = async () => {
      if (!passwordsMatch.value) {
        error.value = 'Les mots de passe ne correspondent pas';
        return;
      }

      if (password.value.length < 6) {
        error.value = 'Le mot de passe doit contenir au moins 6 caractères';
        return;
      }

      try {
        loading.value = true;
        error.value = '';

        // Update password using Supabase
        const { error: updateError } = await supabase.auth.updateUser({
          password: password.value
        }, {
          accessToken: accessToken.value
        });

        if (updateError) throw updateError;

        success.value = true;
        
        // Optionally redirect to login after a delay
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
        
      } catch (err) {
        console.error('Error resetting password:', err);
        error.value = 'Une erreur est survenue lors de la réinitialisation du mot de passe. Le lien est peut-être expiré ou invalide.';
      } finally {
        loading.value = false;
      }
    };

    return {
      password,
      confirmPassword,
      loading,
      error,
      success,
      passwordsMatch,
      handleSubmit,
    };
  },
};
</script>
