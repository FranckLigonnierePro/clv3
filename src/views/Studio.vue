<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Canvas from "../components/studio/Canvas.vue";
import LeftPanel from "../components/studio/LeftPanel.vue";
import ChatSidebar from "../components/studio/ChatSidebar.vue";
import { Grid2X2, Magnet, Share2, MessageSquare, Loader2, X, Copy } from "lucide-vue-next";
import StudioFooter from "../components/studio/StudioFooter.vue";
import type { CanvasElement } from "../components/studio/Canvas.vue";

const showShareModal = ref(false);

// Copier le texte dans le presse-papier
const copyToClipboard = async () => {
  if (!shareLink.value) return;
  try {
    await window.navigator.clipboard.writeText(shareLink.value);
  } catch (err) {
    console.error('Erreur lors de la copie dans le presse-papier:', err);
    alert('Impossible de copier le lien dans le presse-papier');
  }
};

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
  if (viewerCountInterval.value !== null) {
    clearInterval(viewerCountInterval.value);
  }
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
  const cellCountX = 32;
  const cellCountY = 18;

  const cellWidth = canvasDimensions.value.width / cellCountX;
  const cellHeight = canvasDimensions.value.height / cellCountY;

  const elementWidth = 6 * cellWidth;
  const elementHeight = 2 * cellHeight;

  // Trouver le centre *en cellule*, puis calculer la position exacte du coin haut gauche
  const centerCellX = Math.floor(cellCountX / 2);
  const centerCellY = Math.floor(cellCountY / 2);

  const centerX = centerCellX * cellWidth;
  const centerY = centerCellY * cellHeight;

  const x = centerX - elementWidth / 2;
  const y = centerY - elementHeight / 2;

  return {
    id: `text-${Date.now()}`,
    type: 'text',
    x,
    y,
    width: elementWidth,
    height: elementHeight,
    rotation: 0,
    locked: false,
    visible: true,
    data: {
      content: 'New Text',
      color: '#ffffff',
      fontSize: 24,
      fontFamily: 'Arial',
      textAlign: 'center',
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
const shareLink = ref('');
const isGeneratingLink = ref(false);
const shareError = ref('');
const viewerCount = ref(0);
const viewerCountInterval = ref<number | null>(null);
const customRoomName = ref('');

// Fermer la modale après la génération du lien
const handleGenerateLink = async () => {
  await generateShareLink();
  if (shareLink.value) {
    setTimeout(() => {
      showShareModal.value = false;
    }, 1500);
  }
};

// Mettre à jour le compteur de spectateurs
const updateViewerCount = async () => {
  if (!shareLink.value) return;
  
  try {
    const url = new URL(shareLink.value);
    const roomName = url.searchParams.get('room');
    
    if (!roomName) return;
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/viewers/${roomName}`);
    const data = await response.json();
    viewerCount.value = data.viewers;
  } catch (err) {
    console.error('Erreur lors de la récupération du nombre de spectateurs:', err);
  }
};

// Générer un lien de partage
const generateShareLink = async () => {
  try {
    isGeneratingLink.value = true;
    shareError.value = '';
    
    // Utiliser le nom personnalisé ou générer un ID de salle unique
    const roomId = customRoomName.value.trim() || `room-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Appeler l'API pour obtenir un token
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName: roomId,
        participantName: 'host',
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la génération du token');
    }

    const data = await response.json();
    
    // Construire l'URL de partage
    const currentUrl = new URL(window.location.origin);
    currentUrl.pathname = '/watch';
    currentUrl.searchParams.set('room', roomId);
    currentUrl.searchParams.set('token', data.token);
    
    shareLink.value = currentUrl.toString();
    
    // Copier dans le presse-papier
    await navigator.clipboard.writeText(shareLink.value);
    
    // Afficher un message de succès
    alert('Lien copié dans le presse-papier !');
    
    // Démarrer la mise à jour du compteur de spectateurs
    if (viewerCountInterval.value !== null) {
      clearInterval(viewerCountInterval.value);
    }
    await updateViewerCount();
    viewerCountInterval.value = window.setInterval(updateViewerCount, 5000);
    
  } catch (err) {
    console.error('Erreur lors de la génération du lien:', err);
    shareError.value = 'Erreur lors de la génération du lien. Veuillez réessayer.';
  } finally {
    isGeneratingLink.value = false;
  }
};
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
          <div class="flex items-center gap-2">
            <button @click="toggleChat" class="p-2 rounded-full hover:bg-gray-700">
              <MessageSquare class="w-5 h-5" />
            </button>
            
            <!-- Bouton de partage -->
            <div class="relative">
              <div class="flex items-center gap-2">
                <button 
                  @click="showShareModal = true" 
                  class="p-2 rounded-full hover:bg-gray-700 flex items-center gap-1"
                  title="Générer un lien de partage"
                >
                  <Share2 class="w-5 h-5" />
                  <span class="text-sm">Partager</span>
                </button>
                
                <!-- Compteur de spectateurs -->
                <div v-if="shareLink" class="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full">
                  <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span class="text-sm">{{ viewerCount }} spectateur{{ viewerCount !== 1 ? 's' : '' }}</span>
                </div>
              </div>
              
              <!-- Message d'erreur -->
              <div v-if="shareError" class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                {{ shareError }}
              </div>
              
              <!-- Modale de partage -->
              <div v-if="showShareModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Partager la diffusion</h3>
                    <button @click="showShareModal = false" class="text-gray-400 hover:text-white">
                      <X class="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div class="space-y-4">
                    <div>
                      <label for="room-name" class="block text-sm font-medium text-gray-300 mb-1">
                        Nom de la salle (optionnel)
                      </label>
                      <input
                        id="room-name"
                        v-model="customRoomName"
                        type="text"
                        placeholder="Ma diffusion en direct"
                        class="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <button
                      @click="handleGenerateLink"
                      :disabled="isGeneratingLink"
                      class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      :class="{ 'opacity-50 cursor-not-allowed': isGeneratingLink }"
                    >
                      <Loader2 v-if="isGeneratingLink" class="w-4 h-4 animate-spin" />
                      {{ shareLink ? 'Lien copié !' : 'Générer le lien' }}
                    </button>
                    
                    <div v-if="shareLink" class="mt-4 p-3 bg-gray-700 rounded-lg">
                      <p class="text-sm text-gray-300 mb-2">Lien de partage :</p>
                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          :value="shareLink"
                          readonly
                          class="flex-1 bg-gray-800 text-white text-sm p-2 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          @click="copyToClipboard"
                          class="p-2 bg-gray-700 hover:bg-gray-600 rounded"
                          title="Copier le lien"
                        >
                          <Copy class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
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
