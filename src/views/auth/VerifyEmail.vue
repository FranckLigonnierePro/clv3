<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Email
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Please check your email for a verification link.
        </p>
      </div>
      <div v-if="!isVerified" class="mt-8 space-y-6">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="verification-code" class="sr-only">Verification Code</label>
            <input
              id="verification-code"
              v-model="verificationCode"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter verification code"
            />
          </div>
        </div>

        <div>
          <button
            @click="verifyEmail"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Verify Email</span>
            <span v-else>Verifying...</span>
          </button>
        </div>
      </div>
      <div v-else class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg
            class="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h3 class="mt-3 text-lg font-medium text-gray-900">Email Verified!</h3>
        <p class="mt-2 text-sm text-gray-500">
          Your email has been successfully verified. You can now access all features.
        </p>
        <div class="mt-6">
          <router-link
            to="/"
            class="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Go to Dashboard →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export default defineComponent({
  name: 'VerifyEmail',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    
    const verificationCode = ref('');
    const isVerified = ref(false);
    const isLoading = ref(false);
    const error = ref('');

    const verifyEmail = async () => {
      if (!verificationCode.value) {
        error.value = 'Please enter the verification code';
        return;
      }

      isLoading.value = true;
      error.value = '';

      try {
        // TODO: Implement actual email verification API call
        // await authStore.verifyEmail(verificationCode.value);
        
        // For demo purposes, we'll just set isVerified to true after a short delay
        setTimeout(() => {
          isVerified.value = true;
          isLoading.value = false;
        }, 1000);
        
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to verify email. Please try again.';
        isLoading.value = false;
      }
    };

    // Check if there's a token in the URL (from email link)
    const token = route.query.token as string;
    if (token) {
      verificationCode.value = token;
      verifyEmail();
    }

    return {
      verificationCode,
      isVerified,
      isLoading,
      error,
      verifyEmail,
    };
  },
});
</script>
