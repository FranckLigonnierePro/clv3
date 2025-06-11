<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Room, LocalVideoTrack } from 'livekit-client'
import { 
  Video, 
  VideoOff, 
  Image, 
  Monitor, 
  Type, 
  Play, 
  Square,
  Mic, 
  MicOff, 
  Grid3X3, 
  Lock, 
  Unlock,
  Settings,
  ChevronDown,
  Plus,
  Trash2,
  Move,
  RotateCcw,
  FileVideo,
  Camera,
  Users,
  Link
} from 'lucide-vue-next'
import Canvas from '../components/studio/Canvas.vue'
import SceneSelector from '../components/studio/SceneSelector.vue'
import ControlBar from '../components/studio/ControlBar.vue'
import ToolPanel from '../components/studio/ToolPanel.vue'
import SettingsPanel from '../components/studio/SettingsPanel.vue'

// LiveKit state
const generateRoomName = () => `salle-${Math.random().toString(36).substring(2, 8)}`
const roomName = ref('')
const livekitToken = ref('')
const isPublishing = ref(false)
const shareUrl = ref('')
const livekitError = ref('')
const isLinkCopied = ref(false)
const copyButtonText = ref('Copier le lien')
const livekitRoom = ref<any>(null) // Room | null
// const livekitRoom = ref<Room | null>(null) // décommente après install
const canvasComponentRef = ref<any>(null)

// Fonction pour démarrer la diffusion LiveKit
const startLiveKit = async () => {
  livekitError.value = ''
  if (!roomName.value) {
    livekitError.value = 'Le nom de la room est requis.'
    return
  }
  
  isPublishing.value = true
  
  try {
    // 1. Obtenir un token du serveur
    console.log('Tentative de génération du token...');
    const response = await fetch('http://localhost:3001/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName: roomName.value,
        participantName: `host-${Date.now()}`
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Erreur de réponse du serveur:', response.status, error);
      throw new Error(error.error || `Erreur HTTP ${response.status} lors de la génération du token`);
    }
    
    const result = await response.json().catch(e => {
      console.error('Erreur lors du parsing de la réponse:', e);
      throw new Error('Réponse invalide du serveur');
    });
    
    const { token, url } = result;
    console.log('Token reçu, connexion à la room...', { 
      url,
      token: token ? '***' + token.slice(-10) : 'manquant'
    });
    
    // 2. Se connecter à la room LiveKit
    const { Room, RoomEvent } = await import('livekit-client');
    const room = new Room({
      // Activer l'audio et la vidéo automatiquement
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: {
        simulcast: true,
        videoCodec: 'vp8',
        videoEncoding: {
          maxBitrate: 2_500_000,
          maxFramerate: 30,
        },
      },
      videoCaptureDefaults: {
        resolution: { width: 1280, height: 720 }
      }
    });
    
    // Gérer les événements de la room
    room
      .on(RoomEvent.Disconnected, () => {
        console.log('Déconnecté de la room');
        stopLiveKit();
      })
      .on(RoomEvent.Reconnecting, () => console.log('Reconnexion...'))
      .on(RoomEvent.Reconnected, () => console.log('Reconnecté'));
    
    try {
      await room.connect(url, token, {
        autoSubscribe: true,
      });
      livekitRoom.value = room;
      console.log('Connecté à la room:', room.name);
    } catch (error) {
      console.error('Erreur de connexion à la room:', error);
      throw error;
    }
    
        // Référence pour l'animation
    let animationId = null;
    
    // 3. Capturer et diffuser le contenu du canvas
    const captureAndPublishCanvas = async () => {
      const canvas = canvasComponentRef.value?.getCanvas?.();
      if (!canvas) throw new Error('Canvas introuvable');
      
      console.log('Démarrage de la diffusion du canvas...');
      
      // Initialisation du contexte 2D du canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Impossible d\'obtenir le contexte 2D du canvas');
      
      // Fonction pour dessiner le contenu du canvas
      const drawCanvas = () => {
        // Effacer le canvas
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner le fond (noir par défaut)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Si un fond personnalisé est défini, le dessiner par-dessus
        if (currentBackground.value) {
          try {
            ctx.drawImage(currentBackground.value, 0, 0, canvas.width, canvas.height);
          } catch (e) {
            console.error('Erreur lors du dessin du fond:', e);
          }
        }
        
        // Dessiner les éléments de la scène
        const elements = currentElements.value || [];
        elements.forEach(element => {
          if (!element.visible) return;
          
          ctx.save();
          
          // Appliquer les transformations
          ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
          ctx.rotate((element.rotation || 0) * Math.PI / 180);
          
          // Dessiner en fonction du type d'élément
          switch (element.type) {
            case 'image':
              if (element.data?.image) {
                ctx.drawImage(
                  element.data.image,
                  -element.width / 2,
                  -element.height / 2,
                  element.width,
                  element.height
                );
              }
              break;
              
            case 'text':
              if (element.data?.text) {
                ctx.fillStyle = element.data.color || 'white';
                ctx.font = `${element.data.fontSize || 16}px ${element.data.fontFamily || 'Arial'}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                  element.data.text,
                  0,
                  0,
                  element.width
                );
              }
              break;
              
            // Ajouter d'autres types d'éléments au besoin
          }
          
          ctx.restore();
        });
        
        // Mettre à jour l'horodatage
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, canvas.height - 40, 200, 30);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(new Date().toLocaleTimeString(), 20, canvas.height - 25);
        
        // Planifier la prochaine mise à jour
        animationId = requestAnimationFrame(drawCanvas);
      };
      
      // Démarrer la boucle de rendu
      drawCanvas();
      
      // Capturer le flux vidéo du canvas
      const stream = canvas.captureStream(30);
      console.log('Flux capturé, pistes disponibles:', stream.getTracks().map(t => ({
        kind: t.kind,
        id: t.id,
        enabled: t.enabled,
        readyState: t.readyState
      })));
      
      // Créer une piste vidéo à partir du flux du canvas
      const [videoTrack] = stream.getVideoTracks();
      if (!videoTrack) throw new Error('Aucune piste vidéo disponible');
      
      const localVideoTrack = new LocalVideoTrack(videoTrack);
      
      console.log('Piste vidéo créée:', {
        id: localVideoTrack.sid,
        kind: localVideoTrack.kind,
        isMuted: localVideoTrack.isMuted,
        isEnabled: localVideoTrack.isEnabled
      });
      
      // Publier la piste vidéo dans la room
      console.log('Publication de la piste vidéo...');
      try {
        await room.localParticipant.publishTrack(localVideoTrack, {
          name: 'canvas-stream',
          simulcast: true,
          videoEncoding: {
            maxBitrate: 2_500_000,
            maxFramerate: 30,
          },
        });
        
        console.log('Piste vidéo publiée avec succès');
        
        // Vérifier la publication
        console.log('Liste des pistes publiées:', room.localParticipant);
        
        // Vérifier si tracks existe et est itérable
        if (room.localParticipant.tracks) {
          try {
            // Essayer de convertir en tableau de différentes manières selon le type
            let publications = [];
            
            if (Array.isArray(room.localParticipant.tracks)) {
              publications = room.localParticipant.tracks;
            } else if (room.localParticipant.tracks instanceof Map) {
              publications = Array.from(room.localParticipant.tracks.values());
            } else if (room.localParticipant.tracks instanceof Set) {
              publications = Array.from(room.localParticipant.tracks);
            } else if (typeof room.localParticipant.tracks === 'object') {
              // Pour les objets simples
              publications = Object.values(room.localParticipant.tracks);
            }
            
            console.log(`Nombre de pistes publiées: ${publications.length}`);
            
            publications.forEach((pub, index) => {
              if (pub) {
                console.log(`Piste [${index}]:`, {
                  trackSid: pub.trackSid || 'non disponible',
                  kind: pub.kind || 'inconnu',
                  isSubscribed: pub.isSubscribed,
                  track: pub.track ? 'présente' : 'absente',
                  // Ajouter plus d'informations de débogage si nécessaire
                  ...(pub.track ? {
                    id: pub.track.id,
                    readyState: pub.track.readyState,
                    enabled: pub.track.enabled
                  } : {})
                });
              }
            });
          } catch (logError) {
            console.error('Erreur lors de la journalisation des pistes publiées:', logError);
            console.log('Tentative alternative de journalisation des pistes:', room.localParticipant.tracks);
          }
        } else {
          console.warn('Aucune piste disponible dans localParticipant.tracks');
        }
        
      } catch (publishError) {
        console.error('Erreur lors de la publication de la piste vidéo:', publishError);
        // Nettoyer en cas d'erreur
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        throw publishError;
      }
      
      // Nettoyer lors de la déconnexion
      room.on('disconnected', () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
        if (localVideoTrack) {
          localVideoTrack.stop();
        }
      });
    };
    
    await captureAndPublishCanvas();
    
    // 5. Générer l'URL de partage pour les spectateurs
    shareUrl.value = `${window.location.origin}/watch?room=${roomName.value}&token=${token}`;
    
    // Gérer les événements de la room
    room.on('disconnected', () => {
      stopLiveKit();
    });
    
  } catch (e: any) {
    console.error('Erreur LiveKit:', e);
    livekitError.value = e.message || 'Erreur lors de la connexion à LiveKit';
    isPublishing.value = false;
  }
}

const stopLiveKit = async () => {
  if (livekitRoom.value) {
    try {
      await livekitRoom.value.disconnect();
    } catch (e) {
      console.error('Erreur lors de la déconnexion:', e);
    } finally {
      livekitRoom.value = null;
    }
  }
  isPublishing.value = false;
  shareUrl.value = '';
  livekitError.value = '';
}



const route = useRoute()
const studioId = route.params.id

// Résolutions d'exportation disponibles
const exportResolutions = [
  { label: '720p (HD)', value: '720p', width: 1280, height: 720 },
  { label: '1080p (Full HD)', value: '1080p', width: 1920, height: 1080 },
  { label: '2K (QHD)', value: '2k', width: 2560, height: 1440 },
  { label: '4K (UHD)', value: '4k', width: 3840, height: 2160 }
]

// Studio state
const isLive = ref(false)
const isRecording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])
const downloadLink = ref<HTMLAnchorElement | null>(null)
const exportResolution = ref(exportResolutions[1]) // 1080p par défaut
const showExportSettings = ref(false)
const allElementsLocked = ref(false)
const currentBackground = ref<HTMLImageElement | null>(null)
const showSettings = ref(false)
const showGrid = ref(true)
const snapEnabled = ref(true)

// Canvas format
const canvasFormat = ref<'16:9' | '9:16'>('16:9')

// Current scene
const currentScene = ref(1)
const maxScenes = 4

// Canvas elements for each scene
const sceneElements = ref<Record<number, CanvasElement[]>>({
  1: [],
  2: [],
  3: [],
  4: []
})

// Selected element
const selectedElement = ref<string | null>(null)

// Media streams
const cameraStream = ref<MediaStream | null>(null)
const screenStream = ref<MediaStream | null>(null)
const audioStream = ref<MediaStream | null>(null)

// Device lists
const cameras = ref<MediaDeviceInfo[]>([])
const microphones = ref<MediaDeviceInfo[]>([])
const selectedCamera = ref<string>('')
const selectedMicrophone = ref<string>('')

// Audio/Video state
const videoEnabled = ref(true)
const audioEnabled = ref(true)
const audioLevel = ref(0)

interface CanvasElement {
  id: string
  type: 'camera' | 'image' | 'screen' | 'text' | 'video'
  x: number
  y: number
  width: number
  height: number
  locked: boolean
  data: any
}

// Get current scene elements
const currentElements = computed(() => {
  return sceneElements.value[currentScene.value] || []
})

// Initialize devices
const initializeDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    cameras.value = devices.filter(device => device.kind === 'videoinput')
    microphones.value = devices.filter(device => device.kind === 'audioinput')
    
    if (cameras.value.length > 0) {
      selectedCamera.value = cameras.value[0].deviceId
    }
    if (microphones.value.length > 0) {
      selectedMicrophone.value = microphones.value[0].deviceId
    }
  } catch (error) {
    console.error('Error enumerating devices:', error)
  }
}

// Initialize camera
const initCamera = async () => {
  try {
    const constraints = {
      video: selectedCamera.value ? { deviceId: selectedCamera.value } : true,
      audio: false
    }
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    cameraStream.value = stream
    
    // Add camera element to current scene
    const cameraElement: CanvasElement = {
      id: `camera-${Date.now()}`,
      type: 'camera',
      x: canvasFormat.value === '16:9' ? 600 : 200,
      y: canvasFormat.value === '16:9' ? 300 : 500,
      width: 240,
      height: 180,
      locked: false,
      data: { stream }
    }
    
    sceneElements.value[currentScene.value].push(cameraElement)
  } catch (error) {
    console.error('Error accessing camera:', error)
  }
}

// Initialize screen share
const initScreenShare = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ 
      video: true, 
      audio: false 
    })
    screenStream.value = stream
    
    // Add screen share element to current scene
    const screenElement: CanvasElement = {
      id: `screen-${Date.now()}`,
      type: 'screen',
      x: 100,
      y: 100,
      width: canvasFormat.value === '16:9' ? 640 : 300,
      height: canvasFormat.value === '16:9' ? 360 : 400,
      locked: false,
      data: { stream }
    }
    
    sceneElements.value[currentScene.value].push(screenElement)
  } catch (error) {
    console.error('Error accessing screen:', error)
  }
}

// Add image element
const addImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageElement: CanvasElement = {
          id: `image-${Date.now()}`,
          type: 'image',
          x: 200,
          y: 200,
          width: 300,
          height: 200,
          locked: false,
          data: { src: e.target?.result }
        }
        sceneElements.value[currentScene.value].push(imageElement)
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

// Add text element
const addText = () => {
  const textElement: CanvasElement = {
    id: `text-${Date.now()}`,
    type: 'text',
    x: 300,
    y: 300,
    width: 200,
    height: 50,
    locked: false,
    data: { 
      content: 'Your text here',
      fontSize: 24,
      fontWeight: 'normal',
      color: '#ffffff'
    }
  }
  sceneElements.value[currentScene.value].push(textElement)
}

// Add video element
const addVideo = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'video/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      const videoElement: CanvasElement = {
        id: `video-${Date.now()}`,
        type: 'video',
        x: 250,
        y: 150,
        width: 400,
        height: 300,
        locked: false,
        data: { src: url }
      }
      sceneElements.value[currentScene.value].push(videoElement)
    }
  }
  input.click()
}

// Toggle live mode
const handleToggleLive = async () => {
  if (!isLive.value) {
    // Démarrer le live
    try {
      // Vérifier et initialiser les éléments de la scène si nécessaire
      if (!sceneElements.value[currentScene.value]) {
        sceneElements.value[currentScene.value] = [];
      }
      
      // Générer un nom de salle si vide
      if (!roomName.value) {
        roomName.value = generateRoomName();
      }
      
      await startLiveKit();
      isLive.value = true;
      
      // Lock all elements when going live
      if (Array.isArray(currentElements.value)) {
        currentElements.value.forEach(el => {
          if (el) el.locked = true;
        });
      }
      allElementsLocked.value = true;
      selectedElement.value = null;
    } catch (error) {
      console.error('Erreur lors du démarrage du live:', error);
      livekitError.value = 'Erreur lors du démarrage du live';
      isLive.value = false; // S'assurer que l'état est cohérent en cas d'erreur
    }
  } else {
    // Arrêter le live
    try {
      await stopLiveKit();
      isLive.value = false;
      
      // Unlock all elements when stopping live
      if (Array.isArray(currentElements.value)) {
        currentElements.value.forEach(el => {
          if (el) el.locked = false;
        });
      }
      allElementsLocked.value = false;
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du live:', error);
      livekitError.value = 'Erreur lors de l\'arrêt du live';
    }
  }
};

// Toggle recording
const toggleRecording = async () => {
  if (isRecording.value) {
    // Arrêter l'enregistrement
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop()
      mediaRecorder.value = null
    }
    isRecording.value = false
  } else {
    // Démarrer l'enregistrement
    try {
      await startRecording()
      isRecording.value = true
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error)
      isRecording.value = false
    }
  }
}

// Toggle all elements lock
const toggleAllLock = () => {
  allElementsLocked.value = !allElementsLocked.value
  currentElements.value.forEach(el => {
    el.locked = allElementsLocked.value
  })
  if (allElementsLocked.value) {
    selectedElement.value = null
  }
}

// Switch scene
const switchScene = (sceneNumber: number) => {
  if (sceneNumber >= 1 && sceneNumber <= maxScenes) {
    currentScene.value = sceneNumber
    selectedElement.value = null
  }
}

// Toggle canvas format
const toggleCanvasFormat = () => {
  canvasFormat.value = canvasFormat.value === '16:9' ? '9:16' : '16:9'
}

// Delete selected element
const deleteSelectedElement = () => {
  if (selectedElement.value) {
    sceneElements.value[currentScene.value] = currentElements.value.filter(
      el => el.id !== selectedElement.value
    )
    selectedElement.value = null
  }
}

// Handle element selection from canvas
const handleElementSelect = (elementId: string | null) => {
  selectedElement.value = elementId
}

// Handle element update from canvas
const handleElementUpdate = (elementId: string, updates: Partial<CanvasElement>) => {
  const element = currentElements.value.find(el => el.id === elementId)
  if (element) {
    Object.assign(element, updates)
  }
}

// Handle element delete from canvas
const handleElementDelete = (elementId: string) => {
  sceneElements.value[currentScene.value] = currentElements.value.filter(
    el => el.id !== elementId
  )
  if (selectedElement.value === elementId) {
    selectedElement.value = null
  }
}

// Fonction pour copier le lien dans le presse-papiers
const copyToClipboard = async () => {
  if (!shareUrl.value) return;
  
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    isLinkCopied.value = true;
    copyButtonText.value = 'Copié !';
    
    // Réinitialiser l'état après 3 secondes
    setTimeout(() => {
      isLinkCopied.value = false;
      copyButtonText.value = 'Copier le lien';
    }, 3000);
    
    console.log('Lien copié dans le presse-papiers:', shareUrl.value);
  } catch (err) {
    console.error('Erreur lors de la copie du lien:', err);
    // Fallback pour les navigateurs plus anciens
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl.value;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      isLinkCopied.value = true;
      copyButtonText.value = 'Copié !';
      
      setTimeout(() => {
        isLinkCopied.value = false;
        copyButtonText.value = 'Copier le lien';
      }, 3000);
      
      console.log('Lien copié (fallback):', shareUrl.value);
    } catch (err) {
      console.error('Erreur avec la méthode de secours:', err);
    }
    document.body.removeChild(textArea);
  }
};

// Créer un canvas hors-écran avec la résolution souhaitée
const createOffscreenCanvas = (canvas: HTMLCanvasElement, width: number, height: number) => {
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = width
  offscreenCanvas.height = height
  const ctx = offscreenCanvas.getContext('2d')
  
  if (!ctx) throw new Error('Impossible de créer le contexte 2D')
  
  // Mettre à jour la taille du canvas tout en maintenant les proportions
  const ratio = Math.min(width / canvas.width, height / canvas.height)
  const newWidth = canvas.width * ratio
  const newHeight = canvas.height * ratio
  const offsetX = (width - newWidth) / 2
  const offsetY = (height - newHeight) / 2
  
  // Fonction pour dessiner sur le canvas hors-écran
  const draw = () => {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(canvas, offsetX, offsetY, newWidth, newHeight)
  }
  
  return { canvas: offscreenCanvas, draw }
}

// Démarrer l'enregistrement du canvas
const startRecording = async () => {
  try {
    const originalCanvas = canvasComponentRef.value?.getCanvas()
    if (!originalCanvas) {
      throw new Error('Canvas non trouvé')
    }
    
    // Créer un canvas hors-écran avec la résolution sélectionnée
    const { width, height } = exportResolution.value
    const { canvas: offscreenCanvas, draw } = createOffscreenCanvas(originalCanvas, width, height)
    
    // Sauvegarder la fonction de dessin originale
    const originalDraw = originalCanvas.__draw
    
    // Créer une nouvelle fonction de dessin qui met à jour les deux canvas
    const newDraw = () => {
      // Exécuter le dessin original s'il existe
      if (originalDraw) {
        originalDraw.call(originalCanvas)
      }
      // Dessiner sur le canvas hors-écran
      draw()
      console.log('[DEBUG] Frame dessinée sur le canvas hors-écran')
      
      // Planifier la prochaine frame
      if (isRecording.value) {
        requestAnimationFrame(newDraw)
      }
    }
    
    // Remplacer la fonction de dessin
    originalCanvas.__draw = newDraw
    
    // Démarrer l'animation
    let forceFrameId: number | null = null
    newDraw()
    forceFrameId = requestAnimationFrame(function forceFrame() {
      draw()
      if (isRecording.value) {
        forceFrameId = requestAnimationFrame(forceFrame)
      }
    })
    
    // Capture du flux du canvas hors-écran
    const stream = offscreenCanvas.captureStream(30) // 30 FPS
    recordedChunks.value = []
    // Sélection du codec
    let mediaRecorderInstance = null
    const codecs = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      ''
    ]
    for (const codec of codecs) {
      try {
        const options = codec ? { mimeType: codec } : undefined
        mediaRecorderInstance = new MediaRecorder(stream, options)
        break
      } catch (e) { /* ignore */ }
    }
    if (!mediaRecorderInstance) throw new Error('Aucun codec supporté')
    mediaRecorder.value = mediaRecorderInstance
    // Collecte des chunks
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.value.push(event.data)
      }
    }
    // Téléchargement à l'arrêt
    mediaRecorder.value.onstop = () => {
      if (recordedChunks.value.length === 0) return
      const blob = new Blob(recordedChunks.value, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `enregistrement-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 1000)
    }
    // Démarrage de l'enregistrement
    mediaRecorder.value.start(100)
    console.log('Enregistrement démarré')
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error)
  }
}

// Initialize audio monitoring
const initAudioMonitoring = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: selectedMicrophone.value ? { deviceId: selectedMicrophone.value } : true 
    })
    audioStream.value = stream
    
    // Create audio context for level monitoring
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const microphone = audioContext.createMediaStreamSource(stream)
    
    microphone.connect(analyser)
    analyser.fftSize = 256
    
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / bufferLength
      audioLevel.value = (average / 255) * 100
      requestAnimationFrame(updateAudioLevel)
    }
    
    updateAudioLevel()
  } catch (error) {
    console.error('Error accessing microphone:', error)
  }
}

onMounted(() => {
  initializeDevices()
  initAudioMonitoring()
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Notification de lien copié -->
    <div v-if="isLinkCopied" class="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-300">
      Lien copié dans le presse-papiers !
    </div>
    
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Logo & Title -->
        <div class="flex items-center space-x-4">
          <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Video class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-xl font-bold">ClipLive Studio</h1>
            <p class="text-sm text-gray-400">Scene {{ currentScene }}</p>
          </div>
        </div>

        <!-- Scene Selector -->
        <SceneSelector
          :current-scene="currentScene"
          :max-scenes="maxScenes"
          @switch-scene="switchScene"
        />

        <!-- Live/Record Indicators -->
        <div class="flex items-center space-x-4">
          <div v-if="isLive" class="flex items-center space-x-2 bg-red-500 px-3 py-1 rounded-full">
            <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span class="text-white text-sm font-medium">LIVE</span>
          </div>
          
          <div v-if="isRecording" class="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
            <div class="w-2 h-2 bg-white rounded-full"></div>
            <span class="text-white text-sm font-medium">REC</span>
          </div>

          <!-- Settings Button -->
          <button
            @click="showSettings = true"
            class="p-2 hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <Settings class="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>

    <div class="flex h-[calc(100vh-80px)]">
      <!-- Tool Panel -->
      <ToolPanel
        :is-live="isLive"
        :selected-element="selectedElement"
        :current-elements="currentElements"
        @add-camera="initCamera"
        @add-image="addImage"
        @add-text="addText"
        @add-video="addVideo"
        @add-screen="initScreenShare"
        @delete-element="deleteSelectedElement"
      />

      <!-- Main Canvas Area -->
      <div class="flex-1 flex flex-col">
        <!-- Canvas Controls -->
        <div class="bg-gray-800 border-b border-gray-700 px-6 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <!-- Format Toggle -->
              <button
                @click="toggleCanvasFormat"
                class="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors duration-200"
              >
                <Monitor class="w-4 h-4" />
                <span class="text-sm">{{ canvasFormat }}</span>
              </button>

              <!-- Bouton Copier le lien (visible uniquement en live) -->
              <div v-if="isLive && shareUrl" class="relative">
                <div class="flex rounded-md shadow-sm">
                  <input
                    type="text"
                    :value="shareUrl"
                    readonly
                    class="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border-0 bg-gray-700 text-white text-sm"
                    style="min-width: 300px;"
                  >
                  <button
                    @click="copyToClipboard"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {{ copyButtonText }}
                  </button>
                </div>
              </div>
                
              <!-- Bouton Enregistrer avec menu de résolution -->
              <div class="relative">
                <div class="flex items-center space-x-2">
                  <!-- Bouton des paramètres d'export -->
                  <button
                    @click.stop="showExportSettings = !showExportSettings"
                    class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
                    :class="{ 'bg-gray-700': showExportSettings }"
                    title="Paramètres d'export"
                  >
                    <Settings class="w-5 h-5" />
                  </button>

                  <!-- Bouton d'enregistrement -->
                  <button
                    @click="toggleRecording"
                    :class="[
                      'flex items-center px-4 py-2 rounded-full font-medium transition-colors',
                      isRecording 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-white hover:bg-gray-200 text-gray-900'
                    ]"
                  >
                    <span class="w-3 h-3 rounded-full bg-current mr-2"></span>
                    {{ isRecording ? 'ARRÊTER' : 'ENREGISTRER' }}
                  </button>
                </div>

                <!-- Menu déroulant des paramètres d'export -->
                <div v-if="showExportSettings" class="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg z-50">
                  <div class="p-2">
                    <div class="px-3 py-2">
                      <label class="block text-sm font-medium text-gray-300 mb-1">Résolution d'export</label>
                      <select 
                        v-model="exportResolution"
                        class="w-full bg-gray-700 text-white text-sm rounded-md border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                        @click.stop
                      >
                        <option v-for="res in exportResolutions" :key="res.value" :value="res">
                          {{ res.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bouton Live -->
              <button
                @click="handleToggleLive"
                :class="[
                  'flex items-center px-4 py-2 rounded-full font-medium transition-colors',
                  isLive 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-white hover:bg-gray-200 text-gray-900'
                ]"
              >
                <span class="w-3 h-3 rounded-full bg-current mr-2"></span>
                {{ isLive ? 'EN DIRECT' : 'GO LIVE' }}
              </button>

              <!-- Snap Toggle -->
              <div class="flex items-center">
                <button
                  @click="snapEnabled = !snapEnabled"
                  :class="[
                    'flex items-center space-x-2 px-3 py-2 rounded-xl transition-colors',
                    snapEnabled 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  ]"
                >
                  <Move class="w-4 h-4" />
                  <span class="text-sm">Snap</span>
                </button>
              </div>

              <!-- Lock All -->
              <button
                @click="toggleAllLock"
                class="flex items-center space-x-2 px-3 py-2 rounded-xl transition-colors duration-200"
                :class="allElementsLocked ? 'bg-yellow-600 text-white' : 'bg-gray-700 hover:bg-gray-600'"
              >
                <Lock v-if="allElementsLocked" class="w-4 h-4" />
                <Unlock v-else class="w-4 h-4" />
                <span class="text-sm">{{ allElementsLocked ? 'Locked' : 'Lock All' }}</span>
              </button>
            </div>

            <!-- Element Count -->
            <div class="text-sm text-gray-400">
              {{ currentElements.length }} elements
            </div>
          </div>
        </div>

        <!-- Canvas -->
        <div class="flex-1 p-6 bg-gray-900">
          <Canvas
             ref="canvasComponentRef"
             :elements="currentElements"
             :format="canvasFormat"
             :show-grid="showGrid"
             :snap-enabled="snapEnabled"
             :is-live="isLive"
             :selected-element="selectedElement"
             @element-select="handleElementSelect"
             @element-update="handleElementUpdate"
             @element-delete="handleElementDelete"
           />

           <!-- Bouton de partage Live -->
           <div class="mt-6 flex justify-center">
             <div class="relative">
               <button
                 @click="copyShareLink"
                 class="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium transition-all shadow-lg hover:shadow-xl"
               >
                 <Link class="w-5 h-5" />
                 <span>Copier le lien du live</span>
               </button>
               <div 
                 v-if="showShareTooltip"
                 class="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm py-1 px-3 rounded whitespace-nowrap"
               >
                 Lien copié !
               </div>
               <div v-if="livekitError" class="text-red-400 text-xs mt-2 text-center">{{ livekitError }}</div>
             </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Control Bar -->
    <ControlBar
      :is-live="isLive"
      :is-recording="isRecording"
      :video-enabled="videoEnabled"
      :audio-enabled="audioEnabled"
      :audio-level="audioLevel"
      :share-url="shareUrl"
      @toggle-live="handleToggleLive"
      @toggle-recording="toggleRecording"
      @toggle-audio="audioEnabled = !audioEnabled"
      @toggle-video="videoEnabled = !videoEnabled"
    />

    <!-- Settings Panel -->
    <SettingsPanel
      v-if="showSettings"
      :cameras="cameras"
      :microphones="microphones"
      :selected-camera="selectedCamera"
      :selected-microphone="selectedMicrophone"
      :camera-stream="cameraStream"
      :audio-level="audioLevel"
      @close="showSettings = false"
      @camera-change="selectedCamera = $event"
      @microphone-change="selectedMicrophone = $event"
    />
  </div>
</template>