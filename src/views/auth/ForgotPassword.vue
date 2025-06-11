<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Mot de passe oublié
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Entrez votre adresse email pour réinitialiser votre mot de passe
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Adresse email</label>
            <input
              id="email-address"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Adresse email"
            >
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="loading"
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
            {{ loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation' }}
          </button>
        </div>
      </form>
      
      <div class="text-center">
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';

export default {
  name: 'ForgotPassword',
  
  setup() {
    const router = useRouter();
    const email = ref('');
    const loading = ref(false);
    const error = ref('');
    const success = ref('');

    const handleSubmit = async () => {
      if (!email.value) {
        error.value = 'Veuillez entrer votre adresse email';
        return;
      }

      try {
        loading.value = true;
        error.value = '';
        success.value = '';

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (resetError) throw resetError;

        success.value = 'Un email de réinitialisation a été envoyé à votre adresse email.';
        // Optionally redirect to login or show a success message
        // router.push('/auth/login');
      } catch (err) {
        console.error('Error resetting password:', err);
        error.value = 'Une erreur est survenue lors de l\'envoi du lien de réinitialisation.';
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      loading,
      error,
      success,
      handleSubmit,
    };
  },
};
</script>
