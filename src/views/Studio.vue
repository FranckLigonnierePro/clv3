<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Canvas from '../components/studio/Canvas.vue'
import LeftPanel from '../components/studio/LeftPanel.vue'
import ChatSidebar from '../components/studio/ChatSidebar.vue'
import { Mic, MicOff, Video, VideoOff, Circle, CircleDot, Save, MessageSquare } from 'lucide-vue-next'
import type { CanvasElement } from '../components/studio/Canvas.vue'

onMounted(() => {
  console.log('Studio component mounted')
})

// Type d'élément de canvas

// Références au canvas
const containerRef = ref<HTMLElement | null>(null)
const canvasDimensions = ref({ width: 1280, height: 720 }) // Valeurs par défaut

// Mettre à jour les dimensions du canvas après le montage
onMounted(() => {
  updateCanvasDimensions()
  window.addEventListener('resize', updateCanvasDimensions)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasDimensions)
})

const updateCanvasDimensions = () => {
  if (containerRef.value) {
    const container = containerRef.value.querySelector('.canvas-container')
    if (container) {
      canvasDimensions.value = {
        width: container.clientWidth,
        height: container.clientHeight
      }
    }
  }
}

// Fonction utilitaire pour créer un nouvel élément texte centré
const createTextElement = (): CanvasElement => {
  // Calculer la position pour centrer le texte
  const gridCellSize = gridSize.value
  const textWidth = gridCellSize * 5 // Largeur de 5 cellules
  const textHeight = gridCellSize // Hauteur d'une cellule
  
  return {
    id: `text-${Date.now()}`,
    type: 'text',
    x: Math.round((canvasDimensions.value.width - textWidth) / 2 / gridCellSize) * gridCellSize,
    y: Math.round((canvasDimensions.value.height - textHeight) / 2 / gridCellSize) * gridCellSize,
    width: textWidth,
    height: textHeight,
    rotation: 0,
    locked: false,
    visible: true,
    data: {
      content: 'Nouveau texte',
      color: '#ffffff',
      fontSize: gridCellSize * 0.6, // Taille de police proportionnelle à la grille
      fontFamily: 'Arial',
      textAlign: 'center',
      bold: false,
      italic: false,
      underline: false
    }
  }
}

// Références
const canvasRef = ref<InstanceType<typeof Canvas> | null>(null)

// Éléments du canvas
const elements = ref<CanvasElement[]>([])
const selectedElement = ref<string | undefined>(undefined)

// Fonction pour mettre à jour un élément
const updateElement = (updatedElement: CanvasElement) => {
  const index = elements.value.findIndex(el => el.id === updatedElement.id)
  if (index !== -1) {
    const newElements = [...elements.value]
    newElements[index] = updatedElement
    elements.value = newElements
  }
}

// Gestion des événements du canvas
const handleElementSelect = (id: string | undefined) => {
  selectedElement.value = id
}

const handleElementUpdate = (element: CanvasElement) => {
  updateElement(element)
}

const handleElementDelete = (id: string) => {
  elements.value = elements.value.filter(el => el.id !== id)
  if (selectedElement.value === id) {
    selectedElement.value = undefined
  }
}
// Format du canvas (16:9 ou 9:16)
const format = ref<'16:9' | '9:16'>('16:9')
// Contrôles de la grille
const showGrid = ref(true)
const gridSize = ref(40) // Augmenté de 20 à 40 pour des mailles plus grandes
const gridColor = ref('rgba(255, 255, 255, 0.1)')
// selectedElement est maintenant défini plus haut
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

// UI State
const showLeftPanel = ref(true)
const showChat = ref(false)
const messages = ref<Array<{id: string, text: string, sender: string, time: string}>>([])
const newMessage = ref('')

const toggleChat = () => {
  showChat.value = !showChat.value
}

const sendMessage = () => {
  if (newMessage.value.trim()) {
    messages.value.push({
      id: Date.now().toString(),
      text: newMessage.value,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
    newMessage.value = ''
    
    // Auto-scroll to bottom
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 100)
  }
}

const saveProject = () => {
  // Ajouter ici la logique pour sauvegarder le projet
  console.log('Projet enregistré')
}


// Add element functions
const addTextElement = () => {
  const newElement = createTextElement()
  elements.value = [...elements.value, newElement]
  selectedElement.value = newElement.id
}

const addImageElement = () => {
  // TODO: Implement image upload
  console.log('Add image element')
}

const addVideoElement = () => {
  // TODO: Implement video upload
  console.log('Add video element')
}

const addShapeElement = (shape: 'rectangle' | 'circle') => {
  const newElement: CanvasElement = {
    id: `${shape}-${Date.now()}`,
    type: 'shape',
    x: 100,
    y: 100,
    width: 150,
    height: 150,
    rotation: 0,
    locked: false,
    data: {
      shape,
      fill: '#3b82f6',
      stroke: '#1d4ed8',
      strokeWidth: 2,
      opacity: 1
    }
  }
  elements.value = [...elements.value, newElement]
  selectedElement.value = newElement.id
}
</script>

<template>
  <div ref="containerRef" class="flex h-[calc(100%-80px)] w-full relative">
    <!-- Left Panel -->
    <LeftPanel 
      :show-panel="showLeftPanel"
      :elements="elements"
      :selected-element="selectedElement"
      @add-text="addTextElement"
      @add-image="addImageElement"
      @add-video="addVideoElement"
      @add-shape="addShapeElement"
      @select-element="handleElementSelect"
    />
    
    <!-- Main content -->
    <div class="flex-1 flex flex-col h-full overflow-hidden ml-0 transition-all duration-300" 
         :class="{ 'md:ml-64': showLeftPanel }">
    <div class="canvas-container flex justify-center items-center p-4 min-h-0 overflow-hidden w-full">
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
        @element-select="handleElementSelect"
        @element-update="handleElementUpdate"
        @element-delete="handleElementDelete"
      />
    </div>
    </div>
    
    <!-- Chat Sidebar -->
    <ChatSidebar
      :show-chat="showChat"
      :messages="messages"
      @toggle-chat="toggleChat"
      @send-message="sendMessage"
    />
    
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
      
      <div class="controls-right flex items-center gap-4">
        <button 
          class="control-button relative"
          @click="toggleChat"
          title="Ouvrir le chat"
        >
          <MessageSquare class="w-5 h-5" />
          <span v-if="messages.length > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {{ messages.length }}
          </span>
        </button>
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
.chat-messages {
  scrollbar-width: thin;
  scrollbar-color: #3f3f46 #27272a;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #27272a;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 3px;
}

.controls-left, .controls-center, .controls-right {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Chat styles */
.chat-messages {
  scrollbar-width: thin;
  scrollbar-color: #3f3f46 #1f2937;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #1f2937;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 3px;
}

/* Animation for chat messages */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.chat-messages > div {
  animation: fadeIn 0.2s ease-out forwards;
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