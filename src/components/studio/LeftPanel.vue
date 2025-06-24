<script setup lang="ts">
import {
  Type,
  Image as ImageIcon,
  Video as VideoIcon,
  Monitor,
} from "lucide-vue-next";

defineProps({
  showPanel: {
    type: Boolean,
    default: true,
  },
  elements: {
    type: Array,
    required: true,
  },
  selectedElement: {
    type: String,
    default: null,
  },
  showGrid: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "add-text",
  "add-image",
  "add-video",
  "add-shape",
  "add-screen-capture",
  "add-screen-record",
  "select-element",
  "toggle-grid",
]);


</script>

<template>
    <div class="p-2 space-y-4">
      <h3 class="text-white text-xs font-semibold text-center mb-2">
        Éléments
      </h3>
      <div class="grid grid-cols-1 gap-3">
        <!-- Texte -->
        <button
          @click="$emit('add-text')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <Type class="w-5 h-5 mb-1" />
          <span class="text-xs">Texte</span>
        </button>

        <!-- Image -->
        <button
          @click="$emit('add-image')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <ImageIcon class="w-5 h-5 mb-1" />
          <span class="text-xs">Image</span>
        </button>

        <!-- Vidéo -->
        <button
          @click="$emit('add-video')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <VideoIcon class="w-5 h-5 mb-1" />
          <span class="text-xs">Vidéo</span>
        </button>
        
        <!-- Capture d'écran -->
        <button
          @click="$emit('add-screen-capture')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <Monitor class="w-5 h-5 mb-1" />
          <span class="text-xs">Capture</span>
        </button>
        
        <!-- Enregistrement d'écran -->
        <button
          @click="$emit('add-screen-record')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <Monitor class="w-5 h-5 mb-1" />
          <span class="text-xs">Enregistrement</span>
        </button>
      </div>
    </div>
</template>
