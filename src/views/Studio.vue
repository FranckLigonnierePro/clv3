<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Canvas from '../components/studio/Canvas.vue'
import { Mic, MicOff, Video, VideoOff, Circle, CircleDot, Save } from 'lucide-vue-next'

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

// Références
const canvasRef = ref<InstanceType<typeof Canvas> | null>(null)

// Éléments du canvas
const elements = ref<CanvasElement[]>([])
// Format du canvas (16:9 ou 9:16)
const format = ref<'16:9' | '9:16'>('16:9')
// Contrôles de la grille
const showGrid = ref(true)
const gridSize = ref(40) // Augmenté de 20 à 40 pour des mailles plus grandes
const gridColor = ref('rgba(255, 255, 255, 0.1)')
const selectedElement = ref<string | null>(null)
const snapEnabled = ref(true)

// États des contrôles
const isLive = ref(false)
const isRecording = ref(false)
const isMicrophoneOn = ref(true)
const isCameraOn = ref(true)

// Gestion des actions
const toggleLive = () => {
  isLive.value = !isLive.value
  // Ajouter ici la logique pour démarrer/arrêter le streaming
}

const toggleRecording = () => {
  isRecording.value = !isRecording.value
  // Ajouter ici la logique pour démarrer/arrêter l'enregistrement
}

const toggleMicrophone = () => {
  isMicrophoneOn.value = !isMicrophoneOn.value
  // Ajouter ici la logique pour activer/désactiver le micro
}

const toggleCamera = () => {
  isCameraOn.value = !isCameraOn.value
  // Ajouter ici la logique pour activer/désactiver la caméra
}

const saveProject = () => {
  // Ajouter ici la logique pour sauvegarder le projet
  console.log('Projet enregistré')
}
</script>

<template>
  <div class="grid grid-rows-[1fr_auto] h-[calc(100%-80px)] w-full">
    <div class="flex justify-center items-center p-4 min-h-0 overflow-hidden w-full">
      <Canvas 
        ref="canvasRef"
        :elements="elements"
        :show-grid="showGrid"
        :grid-size="gridSize"
        :grid-color="gridColor"
        :format="format"
        :selected-element="selectedElement"
        :snap-enabled="snapEnabled"
        :is-live="isLive"
      />
    </div>
    
    <footer class="fixed bottom-0 w-full h-20 bg-zinc-950 backdrop-blur flex justify-between items-center px-8 z-50">
      <div class="controls-left">
        <button 
          class="control-button"
          :class="{ 'control-active': isMicrophoneOn }"
          @click="toggleMicrophone"
          title="Microphone"
        >
          <component :is="isMicrophoneOn ? Mic : MicOff" class="w-5 h-5" />
        </button>
        <button 
          class="control-button"
          :class="{ 'control-active': isCameraOn }"
          @click="toggleCamera"
          title="Caméra"
        >
          <component :is="isCameraOn ? Video : VideoOff" class="w-5 h-5" />
        </button>
      </div>
      
      <div class="controls-center">
        <button 
          class="live-button"
          :class="{ 'live-active': isLive }"
          @click="toggleLive"
        >
          <span v-if="!isLive">GO LIVE</span>
          <span v-else>LIVE</span>
          <span v-if="isLive" class="record-dot animate-pulse"></span>
        </button>
        
        <button 
          class="record-button"
          :class="{ 'recording': isRecording }"
          @click="toggleRecording"
        >
          <component :is="isRecording ? CircleDot : Circle" class="w-5 h-5" />
          <span>{{ isRecording ? 'Arrêter' : 'Enregistrer' }}</span>
        </button>
      </div>
      
      <div class="controls-right">
        <button 
          class="control-button"
          @click="saveProject"
          title="Enregistrer le projet"
        >
          <Save class="w-5 h-5" />
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>

.controls-left, .controls-center, .controls-right {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.controls-center {
  flex: 1;
  justify-content: center;
}

.control-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.control-active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.live-button, .record-button {
  padding: 0.75rem 1.5rem;
  border-radius: 24px;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.live-button {
  background: #ef4444;
  color: white;
}

.live-button:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.live-active {
  background: #22c55e;
}

.live-active:hover {
  background: #16a34a;
}

.record-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.record-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.recording {
  background: #ef4444;
}

.record-dot {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  display: inline-block;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

</style>