<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Vérification d'email
        </h2>
        <div v-if="!isVerified" class="mt-2 text-center text-sm">
          <p class="text-gray-600">
            Nous avons envoyé un lien de vérification à <span class="font-medium">{{ email || 'votre adresse email' }}</span>
          </p>
          <p class="mt-2 text-gray-500">
            Veuillez vérifier votre boîte de réception et cliquer sur le lien pour vérifier votre adresse email.
          </p>
        </div>
        <div v-else class="mt-2 text-center text-sm">
          <p class="text-green-600 font-medium">
            Votre adresse email a été vérifiée avec succès !
          </p>
        </div>
      </div>

      <div v-if="!isVerified" class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-50 text-gray-500">
              Vous n'avez pas reçu l'email ?
            </span>
          </div>
        </div>

        <div class="mt-6">
          <button
            type="button"
            class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="isResending"
            @click="resendVerificationEmail"
          >
            <svg v-if="isResending" class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isResending ? 'Envoi en cours...' : 'Renvoyer l\'email de vérification' }}
          </button>
        </div>
      </div>

      <div class="mt-6 text-center">
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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';

export default {
  name: 'VerifyEmail',
  
  props: {
    type: {
      type: String,
      default: 'signup' // or 'email_change'
    },
    token: {
      type: String,
      default: ''
    }
  },
  
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    const email = ref('');
    const isVerified = ref(false);
    const isResending = ref(false);
    const error = ref('');
    const success = ref('');

    // Check if we have a token in the URL
    const verifyEmail = async (token: string) => {
      try {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: props.type === 'signup' ? 'signup' : 'email_change'
        });

        if (verifyError) throw verifyError;
        
        isVerified.value = true;
        success.value = 'Votre adresse email a été vérifiée avec succès !';
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
        
      } catch (err) {
        console.error('Error verifying email:', err);
        error.value = 'Le lien de vérification est invalide ou a expiré.';
      }
    };

    // Resend verification email
    const resendVerificationEmail = async () => {
      if (!email.value) {
        error.value = 'Veuillez entrer votre adresse email';
        return;
      }
      
      isResending.value = true;
      error.value = '';
      
      try {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email.value,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify`
          }
        });
        
        if (resendError) throw resendError;
        
        success.value = 'Un nouvel email de vérification a été envoyé.';
        
      } catch (err) {
        console.error('Error resending verification email:', err);
        error.value = 'Une erreur est survenue lors de l\'envoi de l\'email de vérification.';
      } finally {
        isResending.value = false;
      }
    };

    // Check for token in URL on component mount
    onMounted(async () => {
      // Get email from query params or user session
      email.value = route.query.email?.toString() || '';
      
      // If we have a token in the URL, verify the email
      if (props.token) {
        await verifyEmail(props.token);
      } else {
        // Check if user is signed in and get their email
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          email.value = user.email || '';
        }
      }
    });

    return {
      email,
      isVerified,
      isResending,
      error,
      success,
      resendVerificationEmail
    };
  }
};
</script>
