<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Canvas from "../components/studio/Canvas.vue";
import LeftPanel from "../components/studio/LeftPanel.vue";
import ChatSidebar from "../components/studio/ChatSidebar.vue";
import { Grid2X2, Magnet } from "lucide-vue-next";
import StudioFooter from "../components/studio/StudioFooter.vue";
import type { CanvasElement } from "../components/studio/Canvas.vue";

onMounted(() => {
  console.log("Studio component mounted");
});

// Type d'élément de canvas

// Références au canvas
const containerRef = ref<HTMLElement | null>(null);
const canvasDimensions = ref({ width: 1280, height: 720 }); // Valeurs par défaut

// Mettre à jour les dimensions du canvas après le montage
onMounted(() => {
  updateCanvasDimensions();
  window.addEventListener("resize", updateCanvasDimensions);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateCanvasDimensions);
});

const updateCanvasDimensions = () => {
  if (containerRef.value) {
    const container = containerRef.value.querySelector(".canvas-container");
    if (container) {
      canvasDimensions.value = {
        width: container.clientWidth,
        height: container.clientHeight,
      };
    }
  }
};

// Fonction utilitaire pour créer un nouvel élément texte centré sur la grille 32x18
const createTextElement = (): CanvasElement => {
  const cellCountX = 32; // Largeur en cellules
  const cellCountY = 18;  // Hauteur en cellules
  
  // Calculer la taille des cellules pour s'adapter au canvas
  const cellWidth = canvasDimensions.value.width / cellCountX;
  const cellHeight = canvasDimensions.value.height / cellCountY;
  
  // Positionner au centre de la grille (légèrement décalé vers le haut pour le texte)
  const centerX = Math.round((cellCountX / 2) * cellWidth);
  const centerY = Math.round((cellCountY / 2) * cellHeight);
  
  // Taille du texte (en cellules)
  const textWidthCells = 6;  // Largeur de 8 cellules
  const textHeightCells = 1;  // Hauteur de 2 cellules
  
  return {
    id: `text-${Date.now()}`,
    type: "text",
    x: centerX - (textWidthCells * cellWidth) / 2, // Centrer horizontalement
    y: centerY - (textHeightCells * cellHeight) / 2, // Centrer verticalement
    width: textWidthCells * cellWidth,
    height: textHeightCells * cellHeight,
    rotation: 0,
    locked: false,
    visible: true,
    data: {
      content: "Nouveau texte",
      color: "#ffffff",
      fontSize: cellHeight * 0.8, // Taille de police proportionnelle à la hauteur des cellules
      fontFamily: "Arial",
      textAlign: "center",
      bold: false,
      italic: false,
      underline: false,
    },
  };
};

// Références
const canvasRef = ref<InstanceType<typeof Canvas> | null>(null);

// État de sélection
const selectedElementId = ref<string | null>(null);

// Éléments du canvas (sera remplacé lors du changement de scène)
const elements = ref<CanvasElement[]>([]);

// Gérer la sélection d'un élément
const handleElementSelect = (id: string | null) => {
  selectedElementId.value = id;
};

// Mettre à jour un élément
const updateElement = (updatedElement: CanvasElement) => {
  const index = elements.value.findIndex((el) => el.id === updatedElement.id);
  if (index !== -1) {
    const newElements = [...elements.value];
    newElements[index] = { ...newElements[index], ...updatedElement };
    elements.value = newElements;
  }
};

// Gestion des événements du canvas
const handleElementUpdate = (element: CanvasElement) => {
  updateElement(element);
};

// Supprimer un élément
const handleElementDelete = (id: string) => {
  elements.value = elements.value.filter((el) => el.id !== id);
  if (selectedElementId.value === id) {
    selectedElementId.value = null;
  }
};
// Format du canvas (16:9 ou 9:16)
const format = ref<"16:9" | "9:16">("16:9");
// Contrôles de la grille
const showGrid = ref(true);
const gridSize = ref(40); // Taille de la grille en pixels
const gridColor = ref("rgba(139, 92, 246, 0.5)"); // Couleur de la grille
// selectedElement est maintenant défini plus haut
const snapEnabled = ref(true);

// États des contrôles
const isLive = ref(false);
const isRecording = ref(false);
const isMicrophoneOn = ref(true);
const isCameraOn = ref(true);

// Gestion des actions
const toggleLive = () => {
  isLive.value = !isLive.value;
  // Ajouter ici la logique pour démarrer/arrêter le streaming
};

const toggleRecording = () => {
  isRecording.value = !isRecording.value;
  // Ajouter ici la logique pour démarrer/arrêter l'enregistrement
};

const toggleMicrophone = () => {
  isMicrophoneOn.value = !isMicrophoneOn.value;
  // Ajouter ici la logique pour activer/désactiver le micro
};

const toggleCamera = () => {
  isCameraOn.value = !isCameraOn.value;
  // Ajouter ici la logique pour activer/désactiver la caméra
};

// Gestion des scènes
const scenes = ref([
  { id: 1, name: 'Scène 1', active: true },
  { id: 2, name: 'Scène 2', active: false },
  { id: 3, name: 'Scène 3', active: false },
  { id: 4, name: 'Scène 4', active: false },
]);

const currentSceneId = ref(1);
// Stockage des éléments par scène
const sceneElements = ref<{[key: number]: CanvasElement[]}>({});

// Initialiser les éléments vides pour chaque scène existante
onMounted(() => {
  scenes.value.forEach(scene => {
    if (!sceneElements.value[scene.id]) {
      sceneElements.value[scene.id] = [];
    }
  });
});

const changeScene = (sceneId: number) => {
  // Sauvegarder les éléments de la scène courante
  if (currentSceneId.value) {
    sceneElements.value[currentSceneId.value] = [...elements.value];
  }
  
  // Changer de scène
  currentSceneId.value = sceneId;
  
  // Charger les éléments de la nouvelle scène
  if (!sceneElements.value[sceneId]) {
    sceneElements.value[sceneId] = [];
  }
  elements.value = [...sceneElements.value[sceneId]];
  
  // Mettre à jour l'état actif des scènes
  scenes.value = scenes.value.map(scene => ({
    ...scene,
    active: scene.id === sceneId
  }));
};

// Pas de fonction d'ajout de scène - 4 scènes fixes

// UI State
const showLeftPanel = ref(true);
const showChat = ref(false);
const messages = ref<
  Array<{ id: string; text: string; sender: string; time: string }>
>([]);
const newMessage = ref("");

const toggleChat = () => {
  showChat.value = !showChat.value;
};

const sendMessage = () => {
  if (newMessage.value.trim()) {
    messages.value.push({
      id: Date.now().toString(),
      text: newMessage.value,
      sender: "user",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    newMessage.value = "";

    // Auto-scroll to bottom
    setTimeout(() => {
      const chatContainer = document.querySelector(".chat-messages");
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
};

const saveProject = () => {
  // Ajouter ici la logique pour sauvegarder le projet
  console.log("Projet enregistré");
};

// Add element functions
const addTextElement = () => {
  const newElement = createTextElement();
  elements.value = [...elements.value, newElement];
};

// Fonction utilitaire pour créer un nouvel élément image centré sur la grille 32x18
const createImageElement = (imageUrl: string = ''): CanvasElement => {
  const cellCountX = 32; // Largeur en cellules
  const cellCountY = 18;  // Hauteur en cellules
  
  // Calculer la taille des cellules pour s'adapter au canvas
  const cellWidth = canvasDimensions.value.width / cellCountX;
  const cellHeight = canvasDimensions.value.height / cellCountY;
  
  // Positionner au centre de la grille
  const centerX = Math.round((cellCountX / 2) * cellWidth);
  const centerY = Math.round((cellCountY / 2) * cellHeight);
  
  // Taille de l'image (en cellules)
  const imageWidthCells = 8;  // Largeur de 8 cellules
  const imageHeightCells = 6;  // Hauteur de 6 cellules (ratio 4:3)
  
  return {
    id: `image-${Date.now()}`,
    type: "image",
    x: centerX - (imageWidthCells * cellWidth) / 2, // Centrer horizontalement
    y: centerY - (imageHeightCells * cellHeight) / 2, // Centrer verticalement
    width: imageWidthCells * cellWidth,
    height: imageHeightCells * cellHeight,
    rotation: 0,
    locked: false,
    visible: true,
    data: {
      src: imageUrl,
      // Valeurs par défaut pour la gestion de l'image
      aspectRatio: 4/3, // Ratio largeur/hauteur (4:3 par défaut)
      originalWidth: imageWidthCells * cellWidth,
      originalHeight: imageHeightCells * cellHeight,
    },
  };
};

const addImageElement = () => {
  // Créer un input de type file
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  // Gérer la sélection de fichier
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      // Créer une URL pour l'image sélectionnée
      const imageUrl = URL.createObjectURL(file);
      
      // Créer un élément image pour obtenir ses dimensions
      const img = new Image();
      img.onload = () => {
        // Créer un nouvel élément image avec l'URL
        const newElement = createImageElement(imageUrl);
        
        // Mettre à jour les dimensions pour conserver le ratio d'aspect
        const aspectRatio = img.width / img.height;
        newElement.data.aspectRatio = aspectRatio;
        
        // Ajuster la largeur ou la hauteur pour conserver le ratio
        if (aspectRatio > 1) {
          // Image plus large que haute
          newElement.height = newElement.width / aspectRatio;
        } else {
          // Image plus haute que large ou carrée
          newElement.width = newElement.height * aspectRatio;
        }
        
        // Ajouter l'élément au canvas
        elements.value = [...elements.value, newElement];
        
        // Libérer la mémoire de l'URL de l'objet quand elle n'est plus nécessaire
        // (par exemple, quand l'élément est supprimé ou remplacé)
        // Note: Dans une application réelle, vous voudrez peut-être gérer cela différemment
        // pour les images qui sont réutilisées ou sauvegardées
      };
      
      // Définir la source de l'image pour déclencher le chargement
      img.src = imageUrl;
    }
  };
  
  // Déclencher la boîte de dialogue de sélection de fichier
  input.click();
};

</script>

<template>
  <div ref="containerRef" class="flex h-[calc(100%-80px)] w-full relative">
    <!-- Left Panel -->
    <LeftPanel
      :show-panel="showLeftPanel"
      :elements="elements"
      :show-grid="showGrid"
      @add-text="addTextElement"
      @add-image="addImageElement"
      @toggle-grid="showGrid = !showGrid"
    />

    <!-- Main content -->
    <div class="flex-1 flex flex-col h-full overflow-hidden ml-0 transition-all duration-300">
      <div class="flex flex-col items-center w-full p-4 pb-0">
        <!-- Conteneur des boutons au-dessus du canvas -->
        <div class="w-full flex justify-center mb-2 gap-2" :style="{ maxWidth: format === '16:9' ? 'calc(100vh * 16/9 - 6rem)' : 'calc(100vh * 9/16 - 6rem)' }">
          <!-- Bouton Aimant -->
          <button
            @click="snapEnabled = !snapEnabled"
            class="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-sm transition-colors shadow-lg"
            :class="{ 'bg-blue-500/20 text-blue-400': snapEnabled }"
            title="Aimant (Snap to Grid)"
          >
            <Magnet class="w-5 h-5" />
          </button>
          
          <!-- Bouton Grille -->
          <button
            @click="showGrid = !showGrid"
            class="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-sm transition-colors shadow-lg"
            :class="{ 'bg-blue-500/20 text-blue-400': showGrid }"
            title="Afficher la grille"
          >
            <Grid2X2 class="w-5 h-5" />
          </button>
        </div>

        <!-- Canvas -->
        <div class="relative w-full" :style="{ width: format === '16:9' ? 'calc(100vh * 16/9 - 6rem)' : 'calc(100vh * 9/16 - 6rem)' }">
          <Canvas
            ref="canvasRef"
            :elements="elements"
            :show-grid="showGrid"
            :grid-size="gridSize"
            :grid-color="gridColor"
            :format="format"
            :snap-enabled="snapEnabled"
            :is-live="isLive"
            :selected-element-id="selectedElementId"
            @element-update="handleElementUpdate"
            @element-delete="handleElementDelete"
            @element-select="handleElementSelect"
          /> 
        </div>
      </div>
    </div>

    <!-- Chat Sidebar -->
    <ChatSidebar
      :show-chat="showChat"
      :messages="messages"
      @toggle-chat="toggleChat"
      @send-message="sendMessage"
    />

    <StudioFooter
      :is-microphone-on="isMicrophoneOn"
      :is-camera-on="isCameraOn"
      :is-live="isLive"
      :is-recording="isRecording"
      :messages="messages"
      :scenes="scenes"
      :current-scene-id="currentSceneId"
      @toggle-microphone="toggleMicrophone"
      @toggle-camera="toggleCamera"
      @toggle-live="toggleLive"
      @toggle-recording="toggleRecording"
      @toggle-chat="toggleChat"
      @change-scene="changeScene"
      @save-project="saveProject"
    />
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

.controls-left,
.controls-center,
.controls-right {
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
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.live-button,
.record-button {
  padding: 0.75rem 1.5rem;
  border-radius: 24px;
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
