<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Video,
  Bell,
  Home,
  Share2,
  Check
} from "lucide-vue-next";
import { useRoute } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
const isMobileMenuOpen = ref(false);

const userInitials = computed(() => {
  if (!authStore.user?.email) return "?";
  return authStore.user.email.charAt(0).toUpperCase();
});

const route = useRoute();
const isStudioView = computed(() => route.name === 'studio');
const isLinkCopied = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const copyLiveLink = async () => {
  const currentUrl = window.location.origin;
  const watchUrl = `${currentUrl}/watch/${Date.now()}`; // Utilise un ID unique basé sur le timestamp
  
  try {
    await navigator.clipboard.writeText(watchUrl);
    isLinkCopied.value = true;
    
    // Réinitialiser l'état après 3 secondes
    setTimeout(() => {
      isLinkCopied.value = false;
    }, 3000);
  } catch (err) {
    console.error('Erreur lors de la copie du lien:', err);
  }
};

const handleLogout = async () => {
  try {
    // First navigate to landing page
    await router.push("/");
    // Then perform logout
    await authStore.logout();
    // Force a hard reload to ensure all auth state is cleared
    window.location.reload();
  } catch (error) {
    console.error("Logout failed:", error);
    // Even if there's an error, still try to redirect
    window.location.href = "/";
  }
};

const navItems = [
  {
    name: "Accueil",
    to: { name: "dashboard" },
    icon: Home,
    activeRoutes: ["dashboard"],
  },
  {
    name: "Le Studio",
    to: { name: "studio", params: { id: "new" } },
    icon: Video,
    activeRoutes: ["studio"],
  },
];

const userMenuItems = [
  { name: "Profil", to: { name: "profile" }, icon: User },
  { name: "Paramètres", to: { name: "settings" }, icon: Settings },
  { name: "Déconnexion", action: handleLogout, icon: LogOut },
];

// Vérifier si un élément de menu est actif
const isActive = (item: { activeRoutes?: string[] }) => {
  if (!item.activeRoutes) return false;
  const currentRouteName = router.currentRoute.value.name?.toString();
  return currentRouteName
    ? item.activeRoutes.includes(currentRouteName)
    : false;
};
</script>

<template>
  <nav class="bg-zinc-950 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo et navigation principale -->
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <router-link
              to="/dashboard"
              class="text-xl font-bold text-indigo-600"
            >
              ClipLive
            </router-link>
          </div>

          <!-- Navigation desktop -->
          <div class="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
            <router-link
              v-for="item in navItems"
              :key="item.name"
              :to="item.to"
              class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              :class="{
                'border-indigo-500 text-white': isActive(item),
                'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700':
                  !isActive(item),
                'ml-4': item.name !== 'Accueil',
              }"
              @click="isMobileMenuOpen = false"
            >
              <component :is="item.icon" class="mr-2 h-5 w-5" />
              {{ item.name }}
            </router-link>
          </div>
        </div>

        <!-- Menu utilisateur desktop -->
        <div class="hidden sm:ml-6 sm:flex sm:items-center">
          <!-- Menu profil -->
          <div class="ml-3 relative">
            <button
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              class="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              id="user-menu"
              aria-expanded="false"
              aria-haspopup="true"
            >
              <span class="sr-only">Ouvrir le menu utilisateur</span>
              <div
                class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium"
              >
                {{ userInitials }}
              </div>
            </button>
          </div>
        </div>

        <!-- Bouton menu mobile -->
        <div class="-mr-2 flex items-center sm:hidden">
          <button
            @click="toggleMobileMenu"
            type="button"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-expanded="false"
          >
            <span class="sr-only">Ouvrir le menu principal</span>
            <Menu
              v-if="!isMobileMenuOpen"
              class="block h-6 w-6"
              aria-hidden="true"
            />
            <X v-else class="block h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <!-- Menu mobile -->
    <div v-if="isMobileMenuOpen" class="sm:hidden">
      <div class="pt-2 pb-3 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          @click="isMobileMenuOpen = false"
          class="flex items-center px-3 py-2 text-base font-medium rounded-md"
          :class="{
            'bg-indigo-50 border-indigo-500 text-indigo-700':
              isActive(item),
            'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800':
              !isActive(item),
          }"
        >
          <component :is="item.icon" class="mr-3 h-5 w-5" />
          {{ item.name }}
        </router-link>
      </div>

      <!-- Menu utilisateur mobile -->
      <div
        v-if="authStore.isAuthenticated"
        class="pt-4 pb-3 border-t border-gray-200"
      >
        <div class="flex items-center px-4">
          <div class="flex-shrink-0">
            <div
              class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium"
            >
              {{ userInitials }}
            </div>
          </div>
          <div class="ml-3">
            <div class="text-base font-medium text-gray-800">
              {{ authStore.user?.email }}
            </div>
          </div>
        </div>
        <div class="mt-3 space-y-1">
          <template v-for="item in userMenuItems" :key="item.name">
            <router-link
              v-if="!item.action"
              :to="item.to"
              @click="isMobileMenuOpen = false"
              class="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              <component :is="item.icon" class="mr-3 h-5 w-5" />
              {{ item.name }}
            </router-link>
            <button
              v-else
              @click="item.action"
              class="w-full text-left flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              <component :is="item.icon" class="mr-3 h-5 w-5" />
              {{ item.name }}
            </button>
          </template>
        </div>
      </div>

      <!-- Boutons de connexion mobile -->
      <div v-else class="pt-4 pb-3 border-t border-gray-200">
        <div class="space-y-1">
          <router-link
            to="/login"
            @click="isMobileMenuOpen = false"
            class="block w-full px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          >
            Se connecter
          </router-link>
          <router-link
            to="/register"
            @click="isMobileMenuOpen = false"
            class="block w-full px-4 py-2 text-base font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Créer un compte
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>
