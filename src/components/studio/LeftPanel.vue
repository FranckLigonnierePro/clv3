<script setup lang="ts">
import { Type, Image as ImageIcon, Video as VideoIcon, Square, Circle as CircleIcon } from 'lucide-vue-next'

defineProps({
  showPanel: {
    type: Boolean,
    default: true
  },
  elements: {
    type: Array,
    required: true
  },
  selectedElement: {
    type: String,
    default: null
  },
  showGrid: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'add-text',
  'add-image',
  'add-video',
  'add-shape',
  'select-element',
  'toggle-grid'
])

const handleAddShape = (shape: 'rectangle' | 'circle') => {
  emit('add-shape', shape)
}
</script>

<template>
  <div 
    class="left-0 top-0 h-full bg-zinc-950 z-30 flex flex-col transition-all duration-300 ease-in-out overflow-y-auto"
    :class="showPanel ? 'w-20' : 'w-0 opacity-0'"
  >
    <div class="p-2 space-y-4">
      <h3 class="text-white text-xs font-semibold text-center mb-2">Éléments</h3>
      
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
        
        <div class="border-t border-zinc-700 my-1"></div>
        
        <!-- Rectangle -->
        <button 
          @click="handleAddShape('rectangle')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <Square class="w-5 h-5 mb-1" />
          <span class="text-xs">Rectangle</span>
        </button>
        
        <!-- Cercle -->
        <button 
          @click="handleAddShape('circle')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <CircleIcon class="w-5 h-5 mb-1" />
          <span class="text-xs">Cercle</span>
        </button>
        
        <div class="border-t border-zinc-700 my-1"></div>
        
        <!-- Grille -->
        <button 
          @click="$emit('toggle-grid')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
          :class="{ 'bg-zinc-800 text-white': showGrid }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mb-1">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span class="text-xs">Grille</span>
        </button>
      </div>
    </div>
  </div>
</template>
