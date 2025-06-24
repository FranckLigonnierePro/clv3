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
  fontFamily: string;
  color: string;
  backgroundColor: string;
  padding: number;
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

// Types for screen record elements
interface ScreenRecordElement {
  id: string;
  type: 'screenRecord';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio: number;
  locked?: boolean;
}

// Union type for all canvas elements
type CanvasElement = TextElement | ImageElement | ScreenRecordElement;

import { ref } from "vue";
import Canvas from "../components/studio/Canvas.vue";
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
const selectedElement = ref<string | null>(null);

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

// Fonction pour ajouter un élément d'enregistrement d'écran
function addScreenRecordElement() {
  // Récupère la taille réelle du canvas pour les calculs de ratio
  // Nous n'avons pas besoin de récupérer le canvas ici
  // car nous utilisons des ratios relatifs pour le positionnement
  
  // Utilise 40% de la largeur du canvas comme largeur par défaut
  const widthRatio = 0.4;
  // Utilise un ratio d'aspect 16:9 par défaut pour la vidéo
  const aspectRatio = 16/9;
  // Calcule la hauteur en fonction du ratio d'aspect
  const heightRatio = widthRatio / aspectRatio;
  
  // Ajoute l'élément d'enregistrement d'écran
  elements.value.push({
    id: Date.now().toString(),
    type: 'screenRecord' as const,
    x: 0.3, // Position horizontale (0.5 - widthRatio/2)
    y: 0.3, // Position verticale (0.5 - heightRatio/2)
    width: widthRatio,
    height: heightRatio,
    rotation: 0,
    aspectRatio: aspectRatio,
    locked: false
  } as ScreenRecordElement);
}

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
    fontFamily: 'Arial',
    color: '#ffffff',
    backgroundColor: 'transparent',
    padding: 0,
    locked: false
  } as TextElement);
}

// Référence pour l'input file caché
const fileInputRef = ref<HTMLInputElement | null>(null);

function addImageElement() {
  // Ouvre le sélecteur de fichier
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function handleImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    if (!e.target || !e.target.result || typeof e.target.result !== 'string') return;

    // Créer un élément image pour obtenir les dimensions
    const img = new Image();
    img.onload = () => {
      // Calculer le ratio d'aspect
      const aspectRatio = img.width / img.height;

      // Nous n'avons pas besoin de récupérer la taille du canvas ici
      // car nous utilisons des ratios relatifs

      // Détermine la taille appropriée pour l'image
      // Utilise 30% de la largeur du canvas comme largeur par défaut
      const widthRatio = 0.3;
      // Calcule la hauteur en fonction du ratio d'aspect
      const heightRatio = widthRatio / aspectRatio;

      // Ajoute l'élément image
      elements.value.push({
        id: Date.now().toString(),
        type: 'image' as const,
        src: e.target?.result as string,
        alt: file.name,
        x: 0.35, // Centrer horizontalement (0.5 - widthRatio/2)
        y: 0.35, // Centrer verticalement (0.5 - heightRatio/2)
        width: widthRatio,
        height: heightRatio,
        rotation: 0,
        aspectRatio: aspectRatio,
        locked: false
      } as ImageElement);

      // Réinitialiser l'input pour permettre de sélectionner le même fichier
      if (input) input.value = '';
    };
    if (e.target && e.target.result) {
      img.src = e.target.result as string;
    }
  };

  reader.readAsDataURL(file);
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
      type="file"
      ref="fileInputRef"
      @change="handleImageSelected"
      accept="image/*"
      class="hidden"
    />
    <!-- Nous n'avons plus besoin de l'input file pour les captures d'écran car nous utilisons l'API MediaDevices -->
    <div class="flex h-full overflow-hidden pb-16">
      <aside class="w-24 bg-zinc-900 text-white flex-shrink-0">
        <div>
          <LeftPanel
            :show-panel="true"
            :elements="elements"
            :selected-element="selectedElement || undefined"
            :show-grid="showGrid"
            @add-text="addTextElement"
            @add-image="addImageElement"
            @add-screen-record="addScreenRecordElement"
            @select-element="selectedElement = $event"
            @toggle-grid="showGrid = !showGrid"
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
              :show-grid="showGrid"
              :snap-enabled="snapEnabled"
              @element-updated="handleElementUpdated"
              @element-deleted="handleElementDeleted"
              @refresh-capture="refreshCaptureElement"
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