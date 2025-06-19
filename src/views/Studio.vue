<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Room, createLocalVideoTrack, LocalVideoTrack } from "livekit-client"; // LiveKit pour le streaming
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

onUnmounted(() => {
  stopLivekitStream();
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

// État pour la sélection de la caméra
const videoDevices = ref<MediaDeviceInfo[]>([]);
const showCameraSelector = ref(false);
const isMac = navigator.platform.toUpperCase().includes('MAC');

// Lister les caméras disponibles
// Vérifier si la caméra Continuity est disponible (macOS 13+)
const checkContinuityCamera = async () => {
  if (!isMac) return null;
  
  try {
    // Essayer d'accéder à la caméra Continuity avec une contrainte spécifique
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        // Ces contraintes peuvent aider à cibler la caméra Continuity
        advanced: [{
          facingMode: { exact: 'environment' },
          deviceId: { exact: 'continuitycamera' }
        }]
      }
    });
    
    // Si on arrive ici, la caméra Continuity est disponible
    const track = stream.getVideoTracks()[0];
    const deviceId = track.getSettings().deviceId;
    
    // Arrêter le flux temporaire
    track.stop();
    
    return {
      deviceId,
      label: 'iPhone (Continuity Camera)',
      kind: 'videoinput'
    };
  } catch (error) {
    console.log('Continuity Camera non disponible:', error);
    return null;
  }
};

const listVideoDevices = async () => {
  try {
    // Vérifier si l'API est disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('Votre navigateur ne supporte pas la sélection de caméra');
    }
    
    // Vérifier d'abord la caméra Continuity sur Mac
    if (isMac) {
      const continuityCamera = await checkContinuityCamera();
      if (continuityCamera) {
        videoDevices.value = [continuityCamera];
        await selectCamera(continuityCamera.deviceId);
        return;
      }
    }

    // D'abord, essayer d'obtenir la liste des périphériques sans contraintes
    let devices = await navigator.mediaDevices.enumerateDevices();
    
    // Si aucune permission n'est accordée, demander l'accès à la caméra
    if (!devices.some(device => device.kind === 'videoinput' && device.label)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 } 
        });
        // Arrêter le flux immédiatement, on a juste besoin des permissions
        stream.getTracks().forEach(track => track.stop());
        // Recharger la liste des périphériques maintenant que les permissions sont accordées
        devices = await navigator.mediaDevices.enumerateDevices();
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Permission d\'accès à la caméra refusée');
        } else if (err.name === 'NotFoundError') {
          throw new Error('Aucune caméra trouvée sur cet appareil');
        }
        throw err;
      }
    }

    // Filtrer pour ne garder que les périphériques vidéo
    videoDevices.value = devices.filter(device => device.kind === 'videoinput');
    
    if (videoDevices.value.length === 0) {
      throw new Error('Aucune caméra disponible');
    }
    
    // Si une seule caméra est disponible, la sélectionner automatiquement
    if (videoDevices.value.length === 1) {
      await selectCamera(videoDevices.value[0].deviceId);
    } else if (videoDevices.value.length > 1) {
      // Trier pour mettre les caméras intégrées en premier
      videoDevices.value.sort((a, b) => {
        const aIsBack = a.label.toLowerCase().includes('back') || a.label.toLowerCase().includes('arrière');
        const bIsBack = b.label.toLowerCase().includes('back') || b.label.toLowerCase().includes('arrière');
        return (aIsBack === bIsBack) ? 0 : aIsBack ? -1 : 1;
      });
      showCameraSelector.value = true;
    }
  } catch (error) {
    console.error('Erreur caméra:', error);
    // Afficher un message d'erreur à l'utilisateur
    alert(`Erreur: ${error.message || 'Impossible d\'accéder aux caméras'}`);
  }
};

// Sélectionner une caméra spécifique
const selectCamera = async (deviceId: string) => {
  try {
    const constraints = {
      video: { 
        deviceId: { exact: deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const videoElement = createVideoElement(stream);
    elements.value = [...elements.value, videoElement];
    showCameraSelector.value = false;
  } catch (error) {
    console.error('Erreur lors de l\'accès à la caméra:', error);
  }
};

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

// Connexion LiveKit
const roomLivekit = ref<Room | null>(null);

// Démarrer le stream LiveKit (publie le flux vidéo du canvas)
async function startLivekitStream(roomId: string) {
  // Récupérer le token pour la salle LiveKit
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/livekit-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomName: roomId,
    }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du token LiveKit');
  }

  const data = await response.json();
  const token = data.token;

  // Créer une nouvelle connexion LiveKit
  const livekit = new Room({
    url: 'ws://localhost:7880', // à adapter si besoin
    token,
  });

  // Se connecter à la salle LiveKit
  await livekit.connect();

  // Publier le flux vidéo du canvas
  if (!canvasRef.value || typeof canvasRef.value.getCanvas !== 'function') {
    console.error('canvasRef ou getCanvas non disponible');
    return;
  }
  const canvasElement = canvasRef.value.getCanvas();
  if (!canvasElement) {
    console.error('Impossible de récupérer l’élément <canvas>');
    return;
  }
  const stream = canvasElement.captureStream();
  if (!stream) {
    console.error('Impossible de capturer le flux du canvas');
    return;
  }
  const [videoTrack] = stream.getVideoTracks();
  if (!videoTrack) {
    console.error('Aucune piste vidéo trouvée dans le flux du canvas');
    return;
  }
  const localTrack = new LocalVideoTrack(videoTrack);
  await livekit.localParticipant.publishTrack(localTrack);

  // Conserver la connexion LiveKit
  roomLivekit.value = livekit;
}


// Arrêter le stream LiveKit
async function stopLivekitStream() {
  if (roomLivekit.value) {
    // Fermer la connexion LiveKit
    await roomLivekit.value.disconnect();
    roomLivekit.value = null;
  }
}

// Gestion des actions
async function toggleLive() {
  isLive.value = !isLive.value;
  if (isLive.value) {
    // Démarrer le stream LiveKit
    await startLivekitStream(roomId);
  } else {
    // Arrêter le stream LiveKit
    await stopLivekitStream();
  // Ajouter ici la logique pour démarrer/arrêter l'enregistrement
}};

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

const addVideoElement = async (forceContinuity = false) => {
  try {
    showCameraSelector.value = false;
    
    if (forceContinuity && isMac) {
      const constraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{
            facingMode: { exact: 'environment' },
            deviceId: { exact: 'continuitycamera' }
          }]
        },
        audio: false
      };
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoElement = createVideoElement(stream);
        elements.value = [...elements.value, videoElement];
        return;
      } catch (error) {
        console.warn('Impossible d\'accéder à la caméra Continuity:', error);
        // Continuer avec la détection normale
      }
    }
    
    // Réinitialiser la liste des caméras pour forcer un nouvel accès
    videoDevices.value = [];
    await listVideoDevices();
  } catch (error) {
    console.error('Erreur caméra:', error);
    alert(`Erreur: ${error.message || 'Impossible d\'accéder aux caméras'}`);
  }
};

// Cache pour les images chargées
const imageCache = new Map<string, HTMLImageElement>();

// Fonction pour charger une image et la mettre en cache
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // Vérifier si l'image est déjà en cache
    if (imageCache.has(url)) {
      const cachedImg = imageCache.get(url);
      if (cachedImg?.complete) {
        return resolve(cachedImg);
      }
    }

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Pour éviter les problèmes CORS
    
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    
    img.onerror = (err) => {
      console.error('Erreur de chargement de l\'image:', url, err);
      reject(new Error(`Impossible de charger l'image: ${url}`));
    };
    
    img.src = url;
  });
};

const addImageElement = async () => {
  // Créer un input de type file
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  // Gérer la sélection de fichier
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    try {
      // Créer une URL pour l'image sélectionnée
      const imageUrl = URL.createObjectURL(file);
      
      // Charger l'image et attendre qu'elle soit complètement chargée
      const img = await loadImage(imageUrl);
      
      // Créer un nouvel élément image avec l'URL
      const newElement = createImageElement(imageUrl);
      
      // Calculer le ratio d'aspect de l'image
      const aspectRatio = img.width / img.height;
      
      // Mettre à jour les propriétés de l'élément
      newElement.data = {
        ...newElement.data,
        src: imageUrl,
        aspectRatio,
        originalWidth: img.width,
        originalHeight: img.height,
        // Ajouter une référence à l'image chargée
        _img: img
      };
      
      // Ajuster les dimensions pour conserver le ratio d'aspect
      // Limiter la taille maximale à 50% de la largeur/hauteur du canvas
      const maxWidth = canvasDimensions.value.width * 0.5;
      const maxHeight = canvasDimensions.value.height * 0.5;
      
      if (img.width > maxWidth) {
        newElement.width = maxWidth;
        newElement.height = maxWidth / aspectRatio;
      } else if (img.height > maxHeight) {
        newElement.height = maxHeight;
        newElement.width = maxHeight * aspectRatio;
      } else {
        newElement.width = img.width;
        newElement.height = img.height;
      }
      
      // Ajouter l'élément au canvas
      elements.value = [...elements.value, newElement];
      
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image:', error);
      alert(`Erreur: ${error.message || 'Impossible de charger l\'image'}`);
    }
  };
  
  // Déclencher la boîte de dialogue de sélection de fichier
  input.click();
};

// Fonction utilitaire pour créer un nouvel élément vidéo (webcam) centré sur la grille 32x18
const createVideoElement = (stream: MediaStream | null = null): CanvasElement => {
  const cellCountX = 32;
  const cellCountY = 18;

  const cellWidth = canvasDimensions.value.width / cellCountX;
  const cellHeight = canvasDimensions.value.height / cellCountY;

  // Taille de la vidéo en cellules (16:9 par défaut)
  const videoWidth = 8 * cellWidth;
  const videoHeight = (videoWidth * 9) / 16;

  // Positionner au centre
  const x = (canvasDimensions.value.width - videoWidth) / 2;
  const y = (canvasDimensions.value.height - videoHeight) / 2;

  return {
    id: `video-${Date.now()}`,
    type: 'camera', // Utiliser le même type que pour la webcam
    x,
    y,
    width: videoWidth,
    height: videoHeight,
    rotation: 0,
    locked: false,
    visible: true,
    data: {
      stream: stream,
      isWebcam: true,
    },
  };
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
      aspectRatio: 4 / 3, // Ratio largeur/hauteur (4:3 par défaut)
      originalWidth: imageWidthCells * cellWidth,
      originalHeight: imageHeightCells * cellHeight,
    },
  };
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
      @add-video="addVideoElement"
      @toggle-grid="showGrid = !showGrid"
    />
    
    <!-- Boîte de dialogue de sélection de caméra -->
    <div v-if="showCameraSelector" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-zinc-800 rounded-lg p-6 w-96">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-white text-lg font-semibold">Sélectionner une caméra</h3>
          <button 
            v-if="isMac"
            @click="addVideoElement(true)"
            class="text-blue-400 hover:text-blue-300 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Utiliser iPhone
          </button>
        </div>
        <div class="space-y-2">
          <button
            v-for="device in videoDevices"
            :key="device.deviceId"
            @click="selectCamera(device.deviceId)"
            class="w-full p-3 bg-zinc-700 hover:bg-zinc-600 rounded text-white text-left"
          >
            {{ device.label || `Caméra ${device.deviceId.substring(0, 8)}` }}
          </button>
        </div>
        <div class="mt-4 flex justify-end">
          <button
            @click="showCameraSelector = false"
            class="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 rounded text-white"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>

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
