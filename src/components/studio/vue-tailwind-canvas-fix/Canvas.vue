<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

export type CanvasElementType = 'camera' | 'image' | 'screen' | 'text' | 'video'

export interface CanvasElement {
  id: string
  type: CanvasElementType
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  visible?: boolean
  locked?: boolean
  data: {
    stream?: MediaStream
    src?: string
    content?: string
    color?: string
    fontSize?: number
    [key: string]: any
  }
}

const props = withDefaults(defineProps<{
  elements: CanvasElement[]
  format: '16:9' | '9:16'
  selectedElement: string | null
  snapEnabled: boolean
  isLive?: boolean
  showGrid?: boolean
  gridSize?: number
  gridColor?: string
}>(), {
  showGrid: true,
  gridSize: 20,
  gridColor: 'rgba(255, 255, 255, 0.1)',
  isLive: false
})

const emit = defineEmits<{
  (e: 'element-select', id: string | null): void
  (e: 'element-update', element: CanvasElement): void
  (e: 'element-edit', element: CanvasElement): void
  (e: 'element-delete', id: string): void
}>()

// Référence au conteneur parent
const containerRef = ref<HTMLElement | null>(null)

// Réf du canvas HTML réel
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Stockage des balises vidéo hors DOM pour caméra & screen share
const cameraVideos = ref<Record<string, HTMLVideoElement>>({})
const screenVideos = ref<Record<string, HTMLVideoElement>>({})

// État du glisser-déposer
const isDragging = ref(false)
const draggedElement = ref<CanvasElement | null>(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const elementStartX = ref(0)
const elementStartY = ref(0)

// Dimensions du canvas
const canvasDimensions = ref({
  width: 800,  // Valeur par défaut
  height: 450  // 16:9 par défaut
})

// Met à jour les dimensions du canvas en fonction du conteneur
const updateCanvasSize = () => {
  if (!containerRef.value) return

  const container = containerRef.value
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight

  // Choix du ratio selon le format demandé
  let targetRatio = props.format === '9:16' ? 9 / 16 : 16 / 9

  let width = containerWidth
  let height = containerWidth / targetRatio

  // Si le canvas est trop haut pour son conteneur, on adapte en hauteur
  if (height > containerHeight) {
    height = containerHeight
    width = height * targetRatio
  }

  // Mise à jour des dimensions (arrondies)
  canvasDimensions.value = {
    width: Math.floor(width),
    height: Math.floor(height)
  }

  // Mise à jour du canvas physique
  updatePhysicalCanvas()

  // Redessiner le canvas
  requestAnimationFrame(drawCanvas)
}

// Met à jour le canvas physique avec la bonne résolution
const updatePhysicalCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const dpr = window.devicePixelRatio || 1
  const { width, height } = canvasDimensions.value
  
  // Dimensions physiques (pixels réels)
  const physicalWidth = Math.floor(width * dpr)
  const physicalHeight = Math.floor(height * dpr)
  
  // Mise à jour des dimensions physiques
  canvas.width = physicalWidth
  canvas.height = physicalHeight
  
  // Mise à jour des dimensions logiques (CSS)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  
  // Mise à jour du contexte
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
    ctx.imageSmoothingEnabled = true
  }
}

// Initialise les balises vidéo pour chaque stream unique (camera/screen)
watch(() => props.elements, (elements) => {
  elements.forEach(el => {
    if ((el.type === 'camera' || el.type === 'screen') && el.data?.stream) {
      if (!getVideoElement(el.id)) {
        const v = document.createElement('video')
        v.srcObject = el.data.stream
        v.autoplay = true
        v.muted = true
        v.playsInline = true
        v.style.display = 'none'
        v.play().catch(() => {})
        setVideoElement(el, v)
      }
    }
  })
  // Clean up for removed elements
  cleanupVideoElements(elements)
}, { immediate: true, deep: true })

function getVideoElement(id: string) {
  return cameraVideos.value[id] || screenVideos.value[id]
}
function setVideoElement(el: CanvasElement, video: HTMLVideoElement) {
  if (el.type === 'camera') cameraVideos.value[el.id] = video
  if (el.type === 'screen') screenVideos.value[el.id] = video
}
function cleanupVideoElements(elements: CanvasElement[]) {
  Object.keys(cameraVideos.value).forEach(id => {
    if (!elements.find(el => el.id === id && el.type === 'camera')) {
      cameraVideos.value[id]?.pause()
      delete cameraVideos.value[id]
    }
  })
  Object.keys(screenVideos.value).forEach(id => {
    if (!elements.find(el => el.id === id && el.type === 'screen')) {
      screenVideos.value[id]?.pause()
      delete screenVideos.value[id]
    }
  })
}
onUnmounted(() => cleanupVideoElements([]))

// Observer les changements de taille du conteneur
const resizeObserver = new ResizeObserver(() => {
  // Utiliser requestAnimationFrame pour regrouper les mises à jour
  requestAnimationFrame(() => {
    updateCanvasSize()
  })
})

// Ne pas surveiller canvasDimensions pour éviter les boucles
// car updateCanvasSize() met à jour canvasDimensions

onMounted(() => {
  // Mettre à jour la taille initiale
  updateCanvasSize()
  
  // Observer les changements de taille du conteneur
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  
  // Ajouter l'écouteur de redimensionnement avec debounce
  let resizeTimer: number
  const handleResize = () => {
    cancelAnimationFrame(resizeTimer)
    resizeTimer = requestAnimationFrame(updateCanvasSize)
  }
  
  window.addEventListener('resize', handleResize)
  
  // Démarrer la boucle de rendu
  drawCanvas()
  
  // Nettoyage
  return () => {
    window.removeEventListener('resize', handleResize)
    cancelAnimationFrame(resizeTimer)
  }
})

onUnmounted(() => {
  // Nettoyer l'observer
  if (containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
  resizeObserver.disconnect()
  
  // Arrêter la boucle de rendu
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  
  // Nettoyer les ressources vidéo
  cleanupVideoElements([])
})

// Dessin du canvas à chaque frame
let animationFrame: number

// Fonction pour dessiner la grille
const drawGrid = (ctx: CanvasRenderingContext2D) => {
  if (!props.showGrid) return
  
  const { width, height } = canvasDimensions.value
  const size = props.gridSize || 20
  const dotColor = '#8b5cf6' // Couleur violette pour les points
  const dotSize = 2 // Taille des points
  
  ctx.save()
  
  // Dessiner les points aux intersections
  ctx.fillStyle = dotColor
  
  // Calculer le nombre de points nécessaires
  const cols = Math.ceil(width / size)
  const rows = Math.ceil(height / size)
  
  // Ajuster pour centrer la grille si nécessaire
  const offsetX = (width - (cols - 1) * size) / 2
  const offsetY = (height - (rows - 1) * size) / 2
  
  // Dessiner les points aux intersections
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const posX = Math.round(offsetX + x * size)
      const posY = Math.round(offsetY + y * size)
      
      // Dessiner un point arrondi
      ctx.beginPath()
      ctx.arc(posX, posY, dotSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  ctx.restore()
}

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Mettre à jour la taille du canvas si nécessaire
  const { width, height } = canvasDimensions.value
  const dpr = window.devicePixelRatio || 1
  
  // Dimensions physiques (pixels réels)
  const physicalWidth = Math.floor(width * dpr)
  const physicalHeight = Math.floor(height * dpr)
  
  // Mettre à jour les dimensions du canvas
  if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
    canvas.width = physicalWidth
    canvas.height = physicalHeight
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)
  }

  // Sauvegarder l'état du contexte
  ctx.save()
  
  // Effacer le canvas
  ctx.clearRect(0, 0, width, height)
  
  // Dessiner un fond noir
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, width, height)
  
  // Dessiner la grille si activée
  drawGrid(ctx)
  
  // Restaurer l'état du contexte
  ctx.restore()

  props.elements.forEach(element => {
    ctx.save()
    ctx.translate(element.x + element.width/2, element.y + element.height/2)
    // Rotation (optionnelle)
    // ctx.rotate((element.rotation || 0) * Math.PI/180)

    switch (element.type) {
      case 'camera': {
        const v = cameraVideos.value[element.id]
        if (v && v.readyState >= 2) {
          ctx.drawImage(v, -element.width/2, -element.height/2, element.width, element.height)
        }
        break
      }
      case 'screen': {
        const v = screenVideos.value[element.id]
        if (v && v.readyState >= 2) {
          ctx.drawImage(v, -element.width/2, -element.height/2, element.width, element.height)
        }
        break
      }
      case 'image': {
        if (element.data?.src) {
          // Images mises en cache (optimisation possible)
          const img = new window.Image()
          img.src = element.data.src
          ctx.drawImage(img, -element.width/2, -element.height/2, element.width, element.height)
        }
        break
      }
      case 'text': {
        ctx.fillStyle = element.data?.color || 'white'
        ctx.font = `${element.data?.fontSize || 24}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(element.data?.content || '', 0, 0, element.width)
        break
      }
    }
    ctx.restore()
  })

  animationFrame = requestAnimationFrame(drawCanvas)
}

// État pour l'édition de texte
const editingText = ref<{
  elementId: string
  x: number
  y: number
  width: number
  height: number
  content: string
  color: string
  fontSize: number
} | null>(null)

// Gestion des événements de souris
function handleMouseDown(e: MouseEvent) {
  if (!canvasRef.value) return
  
  // Si on est en mode édition, on ne fait rien
  if (editingText.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // Vérifier si on a cliqué sur un élément
  for (let i = props.elements.length - 1; i >= 0; i--) {
    const el = props.elements[i]
    if (el.locked) continue
    
    if (
      x >= el.x && 
      x <= el.x + el.width && 
      y >= el.y && 
      y <= el.y + el.height
    ) {
      isDragging.value = true
      draggedElement.value = { ...el }
      dragStartX.value = x
      dragStartY.value = y
      elementStartX.value = el.x
      elementStartY.value = el.y
      emit('element-select', el.id)
      break
    }
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || !draggedElement.value || !canvasRef.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // Calculer le déplacement
  const dx = x - dragStartX.value
  const dy = y - dragStartY.value
  
  // Mettre à jour la position de l'élément avec snap si activé
  const snapSize = props.snapEnabled ? 10 : 1
  const newX = Math.max(0, Math.round((elementStartX.value + dx) / snapSize) * snapSize)
  const newY = Math.max(0, Math.round((elementStartY.value + dy) / snapSize) * snapSize)
  
  // Émettre la mise à jour
  if (draggedElement.value) {
    emit('element-update', {
      ...draggedElement.value,
      x: newX,
      y: newY
    })
  }
}

function handleMouseUp(e: MouseEvent) {
  isDragging.value = false
  draggedElement.value = null
  
  // Si on est en train d'éditer, on ne fait rien
  if (editingText.value) return
  
  // Si c'est un double-clic sur un élément texte, on active l'édition
  if (e.detail === 2 && !props.isLive) {
    const element = props.elements.find(el => el.id === props.selectedElement)
    if (element?.type === 'text') {
      editingText.value = {
        elementId: element.id,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        content: element.data.content || '',
        color: element.data.color || '#ffffff',
        fontSize: element.data.fontSize || 24
      }
      // On force le focus sur le champ de saisie après un court délai
      nextTick(() => {
        const input = document.getElementById('text-edit-input') as HTMLInputElement
        if (input) {
          input.focus()
          input.select()
        }
      })
    }
  }
}

// Sauvegarder les modifications du texte
function saveTextEdit() {
  if (!editingText.value) return
  
  const element = props.elements.find(el => el.id === editingText.value?.elementId)
  if (!element) return
  
  const updatedElement = {
    ...element,
    data: {
      ...element.data,
      content: editingText.value.content,
      color: editingText.value.color,
      fontSize: editingText.value.fontSize
    }
  }
  
  emit('element-update', updatedElement)
  
  // Si le contenu est vide, on supprime l'élément
  if (!editingText.value.content.trim()) {
    emit('element-delete', editingText.value.elementId)
  }
  
  editingText.value = null
}

// Supprimer un élément
const handleDeleteElement = (elementId: string) => {
  emit('element-delete', elementId)
}

// Annuler l'édition
const cancelTextEdit = () => {
  editingText.value = null
}

// Gestion des événements tactiles
function handleTouchStart(e: TouchEvent) {
  if (!canvasRef.value) return
  
  const touch = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  
  // Trouver l'élément touché
  const element = findElementAt(x, y)
  if (element) {
    isDragging.value = true
    draggedElement.value = element
    dragStartX.value = x
    dragStartY.value = y
    elementStartX.value = element.x
    elementStartY.value = element.y
    
    // Éviter le défilement de la page
    e.preventDefault()
  } else {
    emit('element-select', null)
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value || !draggedElement.value || !canvasRef.value) return
  
  const touch = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  
  // Mettre à jour la position de l'élément
  const dx = x - dragStartX.value
  const dy = y - dragStartY.value
  
  // Mettre à jour la position de l'élément avec snap si activé
  const snapSize = props.snapEnabled ? 10 : 1
  const newX = Math.max(0, Math.round((elementStartX.value + dx) / snapSize) * snapSize)
  const newY = Math.max(0, Math.round((elementStartY.value + dy) / snapSize) * snapSize)
  
  // Mettre à jour l'élément
  draggedElement.value.x = newX
  draggedElement.value.y = newY
  
  // Émettre la mise à jour
  emit('element-update', draggedElement.value)
  e.preventDefault()
}

function handleTouchEnd() {
  isDragging.value = false
  draggedElement.value = null
}

// Fonction utilitaire pour trouver un élément aux coordonnées données
function findElementAt(x: number, y: number): CanvasElement | null {
  // Parcourir les éléments dans l'ordre inverse (du dernier au premier)
  for (let i = props.elements.length - 1; i >= 0; i--) {
    const element = props.elements[i]
    if (
      x >= element.x &&
      x <= element.x + element.width &&
      y >= element.y &&
      y <= element.y + element.height
    ) {
      return element
    }
  }
  return null
}

// Définition des types
interface CanvasDimensions {
  width: number
  height: number
}

// Expose la méthode getCanvas (pour .captureStream())
defineExpose({
  getCanvas: () => canvasRef.value
})
</script>

<template>
  <canvas ref="canvasRef" class="block" />
  <div ref="containerRef" class="relative w-full h-full flex items-center justify-center">
    <!-- Canvas principal -->
    <canvas
      ref="canvasRef"
      class="bg-black rounded-2xl shadow-sm"
      :style="{
        width: `${canvasDimensions.width}px`,
        height: `${canvasDimensions.height}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        touchAction: 'none'
      }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    ></canvas>

    <!-- Éditeur de texte -->
    <div 
      v-if="editingText"
      class="absolute z-10"
      :style="{
        left: `${editingText.x}px`,
        top: `${editingText.y}px`,
        zIndex: 10
      }"
    >
      <div class="flex flex-col bg-gray-800 p-2 rounded shadow-lg" style="min-width: 200px">
        <input
          id="text-edit-input"
          v-model="editingText.content"
          type="text"
          class="bg-gray-700 text-white px-2 py-1 rounded mb-2"
          @keyup.enter="saveTextEdit"
          @keyup.esc="cancelTextEdit"
        />
        <div class="flex items-center space-x-2 mb-2">
          <input
            v-model.number="editingText.fontSize"
            type="number"
            min="8"
            max="200"
            class="w-16 bg-gray-700 text-white px-1 py-1 rounded text-center"
          />
          <input
            v-model="editingText.color"
            type="color"
            class="h-8 w-8 cursor-pointer"
          />
        </div>
        <div class="flex justify-between items-center">
          <button
            @click.stop="handleDeleteElement(editingText.elementId)"
            class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded text-white"
            title="Supprimer l'élément"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <div class="space-x-2">
            <button
              @click.stop="cancelTextEdit"
              class="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              Annuler
            </button>
            <button
              @click.stop="saveTextEdit"
              class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
            >
              Valider
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Indicateur de sélection -->
    <div 
      v-if="selectedElement && !isLive"
      class="absolute border-2 border-blue-400 pointer-events-none"
      :style="{
        left: `${selectedElement.x}px`,
        top: `${selectedElement.y}px`,
        width: `${selectedElement.width}px`,
        height: `${selectedElement.height}px`,
        transform: `rotate(${selectedElement.rotation || 0}deg)`
      }"
    >
      <div class="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full"></div>
      <div class="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></div>
      <div class="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full"></div>
      <div class="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></div>
    </div>
  </div>
</template>