<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

interface Props {
  currentScene: number
  maxScenes: number
}

interface Emits {
  (e: 'switch-scene', sceneNumber: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = ref(false)

const scenes = Array.from({ length: props.maxScenes }, (_, i) => i + 1)

const selectScene = (sceneNumber: number) => {
  emit('switch-scene', sceneNumber)
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors duration-200"
    >
      <span class="font-medium">Scene {{ currentScene }}</span>
      <ChevronDown class="w-4 h-4" :class="{ 'rotate-180': isOpen }" />
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 min-w-32"
    >
      <button
        v-for="scene in scenes"
        :key="scene"
        @click="selectScene(scene)"
        class="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
        :class="{ 'bg-purple-600 text-white': scene === currentScene }"
      >
        Scene {{ scene }}
      </button>
    </div>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      @click="isOpen = false"
      class="fixed inset-0 z-40"
    ></div>
  </div>
</template>