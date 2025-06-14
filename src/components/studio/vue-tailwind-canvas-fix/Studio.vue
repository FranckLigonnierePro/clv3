<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Canvas from '../components/studio/Canvas.vue'

onMounted(() => {
  console.log('Studio component mounted')
})

// Déclaration des types
type CanvasElementType = 'text' | 'camera' | 'image' | 'screen' | 'video'

interface CanvasElement {
  id: string
  type: CanvasElementType
  x: number
  y: number
  width: number
  height: number
  locked: boolean
  data: any
  visible?: boolean
  rotation?: number
}

// Éléments du canvas
const elements = ref    <CanvasElement[]>([])
// Format du canvas (16:9 ou 9:16)
const format = ref<'16:9' | '9:16'>('16:9')
// Contrôles de la grille
const showGrid = ref(true)
const gridSize = ref(20)
const gridColor = ref('rgba(255, 255, 255, 0.1)')

// Fonction pour basculer l'affichage de la grille
const toggleGrid = () => {
  showGrid.value = !showGrid.value
}
</script>

<template>
  <div ref="containerRef" class="w-full h-full flex items-center justify-center overflow-hidden">
  <div class="flex-1 flex items-center justify-center">
    <div class="relative" style="width: 100%; max-width: 1200px; aspect-ratio: 16/9;">
      <!-- Canvas principal -->
      <div class="relative w-full h-full">
        <!-- <div class="absolute top-4 left-4 z-10 flex gap-2">
          <button 
            @click="toggleGrid" 
            class="px-3 py-1 bg-gray-800 bg-opacity-70 text-white rounded-md hover:bg-opacity-100 transition-all"
            :class="{ 'bg-blue-600': showGrid }"
          >
            Grille
          </button>
        </div> -->
            <Canvas 
          :elements="elements" 
          :format="format"
          :selected-element="null"
          :snap-enabled="false"
          :is-live="false"
          :show-grid="showGrid"
          :grid-size="gridSize"
          :grid-color="gridColor"
          @element-select="() => {}"
          @element-update="() => {}"
          @element-delete="() => {}"
          class="w-full h-full"
        />
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
/* Assure que le conteneur parent prend toute la hauteur disponible */
:deep(html), 
:deep(body) {
  height: 100%;
  margin: 0;
  padding: 0;
}

:deep(#app) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>