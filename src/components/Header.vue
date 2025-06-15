<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";
import { Menu, X, Video, Users, Edit3, Play, Settings } from "lucide-vue-next";
import { ref } from "vue";

const route = useRoute();
const mobileMenuOpen = ref(false);

const navigation = [];

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};
</script>

<template>
  <header class="floating-header">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center space-x-2">
          <div
            class="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center"
          >
            <Video class="w-5 h-5 text-white" />
          </div>
          <span class="text-xl font-bold text-gray-900">ClipLive</span>
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-8">
          <RouterLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            class="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            :class="{
              'text-primary-600': route.path.includes(item.href.split('/')[1]),
            }"
          >
            <component :is="item.icon" class="w-4 h-4" />
            <span class="font-medium">{{ item.name }}</span>
          </RouterLink>
        </nav>

        <!-- Actions -->
        <div class="hidden md:flex items-center space-x-4">
          <RouterLink to="/auth/login" class="btn-secondary"
            >Connexion</RouterLink
          >
          <RouterLink to="/auth/register" class="btn-primary"
            >S'inscrire</RouterLink
          >
        </div>

        <!-- Mobile menu button -->
        <button
          @click="toggleMobileMenu"
          class="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
        >
          <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div
      v-show="mobileMenuOpen"
      class="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50"
    >
      <div class="px-4 py-4 space-y-4">
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          class="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors duration-200 p-2 rounded-xl hover:bg-gray-50"
          @click="mobileMenuOpen = false"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span class="font-medium">{{ item.name }}</span>
        </RouterLink>
        <div class="pt-4 border-t border-gray-200 space-y-2">
          <RouterLink
            to="/auth/login"
            class="w-full btn-secondary"
            @click="mobileMenuOpen = false"
            >Connexion</RouterLink
          >
          <RouterLink
            to="/auth/register"
            class="w-full btn-primary"
            @click="mobileMenuOpen = false"
            >S'inscrire</RouterLink
          >
        </div>
      </div>
    </div>
  </header>
</template>
