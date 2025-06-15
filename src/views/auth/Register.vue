<template>
  <div class="max-w-md w-full space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 text-center">
      Créer un compte
    </h1>

    <!-- Alert -->
    <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>

    <!-- Register form -->
    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700"
          >Email</label
        >
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700"
          >Mot de passe</label
        >
        <input
          id="password"
          v-model="password"
          type="password"
          required
          minlength="6"
          autocomplete="new-password"
          class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        :disabled="loading"
      >
        <span
          v-if="loading"
          class="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
        ></span>
        Créer un compte
      </button>
    </form>

    <div class="flex items-center justify-between">
      <span class="border-b w-full"></span>
      <span class="text-xs text-gray-400 px-2">ou</span>
      <span class="border-b w-full"></span>
    </div>

    <!-- Google button -->
    <button
      @click="handleGoogleLogin"
      class="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md bg-white hover:bg-gray-50"
      :disabled="loading"
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        class="h-5 w-5 mr-2"
      />
      Continuer avec Google
    </button>

    <p class="text-sm text-center text-gray-600">
      Déjà un compte ?
      <RouterLink to="/auth/login" class="text-blue-600 hover:underline"
        >Se connecter</RouterLink
      >
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const loading = ref(false);

const handleRegister = async () => {
  try {
    loading.value = true;
    error.value = null;
    await authStore.registerWithEmail(email.value, password.value);
    router.push("/dashboard");
  } catch (err: any) {
    error.value = err.message || "Échec de l'inscription";
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = async () => {
  try {
    loading.value = true;
    error.value = null;
    await authStore.loginWithGoogle();
  } catch (err: any) {
    error.value = err.message || "Échec de la connexion Google";
  } finally {
    loading.value = false;
  }
};
</script>
