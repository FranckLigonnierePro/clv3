<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'

interface CanvasElement {
  id: string
  type: 'camera' | 'image' | 'screen' | 'text'
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

const props = defineProps<{
  elements: CanvasElement[]
  format: '16:9' | '9:16'
  selectedElement: string | null
  snapEnabled: boolean
  isLive: boolean
  showGrid?: boolean
}>()

const emit = defineEmits(['element-select', 'element-update', 'element-edit'])

// Réf du canvas HTML réel
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Stockage des balises vidéo hors DOM pour caméra & screen share
const cameraVideos = ref<Record<string, HTMLVideoElement>>({})
const screenVideos = ref<Record<string, HTMLVideoElement>>({})

// Gère les dimensions du canvas
const canvasDimensions = computed(() => props.format === '16:9'
  ? { width: 960, height: 540 }
  : { width: 540, height: 960 }
)

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

// Gestion du glisser-déposer
let isDragging = false
let draggedElement: CanvasElement | null = null
let dragStartX = 0
let dragStartY = 0
let elementStartX = 0
let elementStartY = 0

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
      isDragging = true
      draggedElement = { ...el }
      dragStartX = x
      dragStartY = y
      elementStartX = el.x
      elementStartY = el.y
      emit('element-select', el.id)
      break
    }
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging || !draggedElement || !canvasRef.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // Calculer le déplacement
  const dx = x - dragStartX
  const dy = y - dragStartY
  
  // Mettre à jour la position de l'élément avec snap si activé
  const snapSize = props.snapEnabled ? 10 : 1
  const newX = Math.max(0, Math.round((elementStartX + dx) / snapSize) * snapSize)
  const newY = Math.max(0, Math.round((elementStartY + dy) / snapSize) * snapSize)
  
  // Émettre la mise à jour
  emit('element-update', draggedElement.id, { x: newX, y: newY })
}

function handleMouseUp(e: MouseEvent) {
  isDragging = false
  draggedElement = null
  
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
  
  emit('element-update', editingText.value.elementId, {
    data: {
      content: editingText.value.content,
      color: editingText.value.color,
      fontSize: editingText.value.fontSize
    }
  })
  
  // Si le contenu est vide, on supprime l'élément
  if (!editingText.value.content.trim()) {
    emit('element-delete', editingText.value.elementId)
  }
  
  editingText.value = null
}

// Annuler l'édition
function cancelTextEdit() {
  editingText.value = null
}

// Gestion des événements tactiles
function handleTouchStart(e: TouchEvent) {
  if (!canvasRef.value || props.isLive) return
  
  const touch = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  
  // Vérifier si on a touché un élément
  for (let i = props.elements.length - 1; i >= 0; i--) {
    const el = props.elements[i]
    if (el.locked) continue
    
    if (
      x >= el.x && 
      x <= el.x + el.width && 
      y >= el.y && 
      y <= el.y + el.height
    ) {
      isDragging = true
      draggedElement = { ...el }
      dragStartX = x
      dragStartY = y
      elementStartX = el.x
      elementStartY = el.y
      emit('element-select', el.id)
      e.preventDefault()
      break
    }
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging || !draggedElement || !canvasRef.value) return
  
  const touch = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  
  // Calculer le déplacement
  const dx = x - dragStartX
  const dy = y - dragStartY
  
  // Mettre à jour la position de l'élément avec snap si activé
  const snapSize = props.snapEnabled ? 10 : 1
  const newX = Math.max(0, Math.round((elementStartX + dx) / snapSize) * snapSize)
  const newY = Math.max(0, Math.round((elementStartY + dy) / snapSize) * snapSize)
  
  // Émettre la mise à jour
  emit('element-update', draggedElement.id, { x: newX, y: newY })
  e.preventDefault()
}

function handleTouchEnd() {
  isDragging = false
  draggedElement = null
}

// Dessin du canvas à chaque frame
let animationFrame: number

function drawGrid(ctx: CanvasRenderingContext2D) {
  if (!props.showGrid) return
  
  const { width, height } = canvasDimensions.value
  const gridSize = 20
  const lineColor = 'rgba(255, 255, 255, 0.1)'
  
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 1
  
  // Lignes verticales
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  // Lignes horizontales
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Mettre à jour la taille du canvas si nécessaire
  if (canvas.width !== canvasDimensions.value.width || canvas.height !== canvasDimensions.value.height) {
    canvas.width = canvasDimensions.value.width
    canvas.height = canvasDimensions.value.height
  }

  // Sauvegarder l'état du contexte
  ctx.save()
  
  // Effacer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Dessiner un fond noir
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
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

onMounted(() => {
  drawCanvas()
})
onUnmounted(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame)
})

// Expose la méthode getCanvas (pour .captureStream())
defineExpose({
  getCanvas: () => canvasRef.value
})
</script>

<template>
  <div class="relative">
    <canvas
      ref="canvasRef"
      :width="canvasDimensions.width"
      :height="canvasDimensions.height"
      :style="{
        display: 'block',
        background: '#000',
        borderRadius: '16px',
        cursor: isDragging ? 'grabbing' : 'default',
        touchAction: 'none', // Important pour le déplacement sur mobile
        position: 'relative',
        zIndex: 1
      }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @dblclick="(e) => e.preventDefault()"
      @mouseleave="handleMouseUp"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    />
    
    <!-- Éditeur de texte -->
    <div 
      v-if="editingText"
      :style="{
        position: 'absolute',
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
        <div class="flex justify-end space-x-2">
          <button
            @click="cancelTextEdit"
            class="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            Annuler
          </button>
          <button
            @click="saveTextEdit"
            class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
          >
            Valider
          </button>
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