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
const elements = ref<CanvasElement[]>([])
// Format du canvas (16:9 ou 9:16)
const format = ref<'16:9' | '9:16'>('16:9')
</script>

<template>
  <div class="flex-1 flex items-center justify-center p-4">
    <div class="relative" style="width: 80%; max-width: 1200px; aspect-ratio: 16/9;">
      <!-- Canvas principal -->
      <Canvas 
        :elements="elements" 
        :format="format"
        :selected-element="null"
        :snap-enabled="false"
        :is-live="false"
        :show-grid="false"
        @element-select="() => {}"
        @element-update="() => {}"
        @element-delete="() => {}"
        class="w-full h-full"
      />
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