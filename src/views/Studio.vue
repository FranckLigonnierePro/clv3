<script setup lang="ts">
// Types for text elements
interface TextElement {
  id: string;
  type: 'text';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize: number;
  isEditing?: boolean;
  style?: any;
  locked?: boolean;
}

// Types for image elements
interface ImageElement {
  id: string;
  type: 'image';
  src: string;
  alt?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio: number;
  locked?: boolean;
}

// Union type for all canvas elements
type CanvasElement = TextElement | ImageElement;

import { ref } from "vue";
import Canvas from "../components/studio/Canvas.vue";
import { onMounted } from "vue";
import LeftPanel from "../components/studio/LeftPanel.vue";
import ChatSidebar from "../components/studio/ChatSidebar.vue";
import { Grid2X2 } from "lucide-vue-next";
import StudioFooter from "../components/studio/StudioFooter.vue";

const showGrid = ref(false);
const showChat = ref(false);
const snapEnabled = ref(true);
const elements = ref<CanvasElement[]>([]);
// Ref pour accéder au canvas HTML
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Props for StudioFooter
const scenes = ref([
  { id: 1, name: 'Scène 1', active: true },
  { id: 2, name: 'Scène 2', active: false }
]);
const currentSceneId = ref(1);
const isMicrophoneOn = ref(false);
const isCameraOn = ref(false);
const isLive = ref(false);
const isRecording = ref(false);
const messages = ref([]);

function addTextElement() {
  // Récupère la taille réelle du canvas
  let canvas: HTMLCanvasElement | null = null;
  if (canvasRef.value) {
    // Si le composant Canvas expose le ref du vrai canvas HTML
    canvas = canvasRef.value;
  } else {
    // fallback par défaut
    canvas = { width: 1280, height: 720 } as HTMLCanvasElement;
  }
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Taille du texte area : 20% largeur, 10% hauteur du canvas
  const widthRatio = 0.2;
  const fontSizePx = 0.03 * canvasHeight;

  elements.value.push({
    id: Date.now().toString(),
    type: 'text' as const,
    text: 'nouveau texte',
    x: 0.1,
    y: 0.1,
    width: widthRatio,
    height: 0.1,
    rotation: 0,
    fontSize: fontSizePx / canvasHeight, // stocké en ratio (ex: 0.03)
    style: {
      fontFamily: 'Arial',
      fill: 0xffffff,
      align: 'center',
      fontWeight: 'bold',
    },
    locked: false
  } as TextElement);
}

// Référence pour l'input file caché
const fileInputRef = ref<HTMLInputElement | null>(null);

function addImageElement() {
  // Ouvrir le sélecteur de fichier
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function handleImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  
  const file = input.files[0];
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner une image valide');
    return;
  }
  
  // Récupère la taille réelle du canvas
  let canvas: HTMLCanvasElement | null = null;
  if (canvasRef.value) {
    // Si le composant Canvas expose le ref du vrai canvas HTML
    canvas = canvasRef.value;
  } else {
    // fallback par défaut
    canvas = { width: 1280, height: 720 } as HTMLCanvasElement;
  }
  
  // Taille de l'image : 30% largeur, 30% hauteur du canvas
  const widthRatio = 0.3;
  
  // Créer une URL pour l'image sélectionnée
  const imageUrl = URL.createObjectURL(file);
  
  // Créer un élément Image pour obtenir les dimensions réelles
  const img = new Image();
  img.onload = () => {
    // Calculer le ratio d'aspect réel de l'image
    const aspectRatio = img.width / img.height;
    
    // Ajouter l'élément image au canvas
    elements.value.push({
      id: Date.now().toString(),
      type: 'image' as const,
      src: imageUrl,
      alt: file.name,
      x: 0.35, // Centré horizontalement
      y: 0.35, // Centré verticalement
      width: widthRatio,
      height: widthRatio / aspectRatio, // Ajuster la hauteur en fonction du ratio d'aspect
      rotation: 0,
      aspectRatio: aspectRatio,
      locked: false
    } as ImageElement);
    
    // Réinitialiser l'input file pour permettre de sélectionner la même image à nouveau
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  };
  
  // Déclencher le chargement de l'image
  img.src = imageUrl;
}

const toggleChat = () => {
  showChat.value = !showChat.value;
};

function handleElementUpdated({ id, x, y, text, width, height, rotation, aspectRatio, locked }: { id: string, x?: number, y?: number, text?: string, width?: number, height?: number, rotation?: number, aspectRatio?: number, locked?: boolean }) {
  const el = elements.value.find(e => e.id === id);
  if (el) {
    if (x !== undefined) el.x = x;
    if (y !== undefined) el.y = y;
    if (text !== undefined && el.type === 'text') el.text = text;
    if (width !== undefined) el.width = width;
    if (height !== undefined) el.height = height;
    if (rotation !== undefined) el.rotation = rotation;
    if (aspectRatio !== undefined && el.type === 'image') el.aspectRatio = aspectRatio;
    if (locked !== undefined) el.locked = locked;
  }
}

function handleElementDeleted(id: string) {
  elements.value = elements.value.filter(e => e.id !== id);
}

// --- StudioFooter Handlers ---
const toggleMicrophone = () => isMicrophoneOn.value = !isMicrophoneOn.value;
const toggleCamera = () => isCameraOn.value = !isCameraOn.value;
const toggleLive = () => isLive.value = !isLive.value;
const toggleRecording = () => isRecording.value = !isRecording.value;
const changeScene = (sceneId: number) => {
  currentSceneId.value = sceneId;
  scenes.value.forEach(scene => scene.active = scene.id === sceneId);
};

const toggleSnap = () => {
  snapEnabled.value = !snapEnabled.value;
};
</script>

<template>
  <div class="h-screen bg-zinc-900">
    <!-- Input file caché pour la sélection d'images -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleImageSelected"
    />
    <div class="flex h-full overflow-hidden pb-16">
      <aside class="w-24 bg-zinc-900 text-white flex-shrink-0">
        <div>
          <LeftPanel 
            :elements="elements"
            @add-text="addTextElement"
            @add-image="addImageElement"
            />
        </div>
      </aside>
      <div class="flex flex-1">
        <main class="flex-1 flex flex-col p-4 gap-4">
          <h1 class="text-3xl font-bold text-gray-800 dark:text-white flex-shrink-0">
            Ratio 16:9 Optimisé
          </h1>
          <button @click="showGrid = !showGrid" class="text-white">
            <Grid2X2 />
          </button>
          <button @click="toggleSnap" :class="{ active: snapEnabled }" class="text-white">
            Snap grille : <strong>{{ snapEnabled ? 'Activé' : 'Désactivé' }}</strong>
          </button>
          <div id="studio-canvas" class="w-full min-h-0 pb-16">
            <Canvas 
              ref="canvasRef"
              :elements="elements"
              :showGrid="showGrid"
              :snapEnabled="snapEnabled"
              @element-updated="handleElementUpdated"
              @element-deleted="handleElementDeleted"
            />
          </div>
        </main>

      </div>
      <ChatSidebar 
          :showChat="showChat"
          :messages="messages"
          @toggle-chat="toggleChat"
        />
    </div>
    <StudioFooter 
      :scenes="scenes"
      :currentSceneId="currentSceneId"
      :isMicrophoneOn="isMicrophoneOn" :isCameraOn="isCameraOn"
      :isLive="isLive"
      :isRecording="isRecording"
      :messages="messages"
      @toggle-microphone="toggleMicrophone"
      @toggle-camera="toggleCamera"
      @toggle-live="toggleLive"
      @toggle-recording="toggleRecording"
      @change-scene="changeScene"
      @toggle-chat="toggleChat"
    />
  </div>
</template>