<script setup lang="ts">
import type { CanvasElement } from './Canvas.vue'

withDefaults(defineProps<{
  elements: CanvasElement[]
  selectedElement: string | null
}>(), {
  selectedElement: null
})

const emit = defineEmits<{
  (e: 'select-element', id: string): void
}>()

// Helper function to get element display name
const getElementName = (element: CanvasElement): string => {
  switch (element.type) {
    case 'text':
      const content = element.data?.content || ''
      return content.substring(0, 20) + (content.length > 20 ? '...' : '') || 'Texte sans contenu'
    case 'image':
      return 'Image'
    case 'video':
      return 'Vidéo'
    case 'shape':
      return element.data?.shape === 'circle' ? 'Cercle' : 'Rectangle'
    default:
      return 'Élément'
  }
}
</script>

<template>
  <div class="p-4 flex-1 overflow-y-auto">
    <h4 class="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
      Éléments ({{ elements.length }})
    </h4>
    <div v-if="elements.length === 0" class="text-center text-zinc-500 text-sm py-4">
      Aucun élément
    </div>
    <div v-else class="space-y-1">
      <div 
        v-for="element in elements" 
        :key="element.id"
        @click="emit('select-element', element.id)"
        class="px-2 py-1.5 text-sm rounded-md cursor-pointer flex items-center gap-2"
        :class="{
          'bg-blue-900/50 text-white': selectedElement === element.id,
          'text-zinc-300 hover:bg-zinc-800': selectedElement !== element.id
        }"
      >
        <span class="truncate">
          {{ getElementName(element) }}
        </span>
      </div>
    </div>
  </div>
</template>
