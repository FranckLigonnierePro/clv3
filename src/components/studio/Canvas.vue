<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'

interface CanvasElement {
  id: string
  type: 'camera' | 'image' | 'screen' | 'text'
  x: number
  y: number
  width: number
  height: number
  data: any // { stream? / src? / content? / color? ... }
}

const props = defineProps<{
  elements: CanvasElement[]
  format: '16:9' | '9:16'
}>()

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

// Dessin du canvas à chaque frame
let animationFrame: number

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Fixe les dimensions physiques
  if (canvas.width !== canvasDimensions.value.width || canvas.height !== canvasDimensions.value.height) {
    canvas.width = canvasDimensions.value.width
    canvas.height = canvasDimensions.value.height
  }

  // Efface le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
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
  <canvas
    ref="canvasRef"
    :width="canvasDimensions.width"
    :height="canvasDimensions.height"
    style="display: block; background: #000; border-radius: 16px"
  />
</template>