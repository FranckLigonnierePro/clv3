<script setup lang="ts">
import { Type, Image as ImageIcon, Video as VideoIcon, Square, Circle as CircleIcon } from 'lucide-vue-next'
import ElementsList from './ElementsList.vue'

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
    default: null,
    required: false
  }
})

const emit = defineEmits([
  'add-text',
  'add-image',
  'add-video',
  'add-shape',
  'select-element'
])

const handleAddShape = (shape: 'rectangle' | 'circle') => {
  emit('add-shape', shape)
}
</script>

<template>
  <div 
    class="fixed left-0 top-0 h-full bg-zinc-900 border-r border-zinc-800 z-30 flex flex-col transition-all duration-300 ease-in-out"
    :class="showPanel ? 'w-64' : 'w-0 opacity-0'"
  >
    <div class="p-4 border-b border-zinc-800">
      <h3 class="text-white font-semibold mb-4">Éléments</h3>
      <div class="space-y-2">
        <button 
          @click="$emit('add-text')"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-300 hover:bg-zinc-800 rounded-md transition-colors"
        >
          <Type class="w-4 h-4" />
          <span>Texte</span>
        </button>
        <button 
          @click="$emit('add-image')"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-300 hover:bg-zinc-800 rounded-md transition-colors"
        >
          <ImageIcon class="w-4 h-4" />
          <span>Image</span>
        </button>
        <button 
          @click="$emit('add-video')"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-300 hover:bg-zinc-800 rounded-md transition-colors"
        >
          <VideoIcon class="w-4 h-4" />
          <span>Vidéo</span>
        </button>
        <div class="border-t border-zinc-800 my-2"></div>
        <button 
          @click="handleAddShape('rectangle')"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-300 hover:bg-zinc-800 rounded-md transition-colors"
        >
          <Square class="w-4 h-4" />
          <span>Rectangle</span>
        </button>
        <button 
          @click="handleAddShape('circle')"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-300 hover:bg-zinc-800 rounded-md transition-colors"
        >
          <CircleIcon class="w-4 h-4" />
          <span>Cercle</span>
        </button>
      </div>
    </div>
    
    <!-- Elements list component -->
    <ElementsList 
      :elements="elements"
      :selected-element="selectedElement"
      @select-element="$emit('select-element', $event)"
    />
  </div>
</template>
