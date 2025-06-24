<template>
  <div
    class="absolute cursor-move select-none"
    :style="blockStyle"
    @mousedown.stop="emit('interaction', $event, block.id, 'move')"
  >
    <!-- Screen record container -->
    <div ref="videoContainerRef" class="w-full h-full flex items-center justify-center overflow-hidden">
      <!-- Border overlay that adapts to video dimensions -->
      <div 
        v-if="videoReady"
        :class="['absolute', { 'border-2 border-blue-500 z-10': isActive, 'border-2 border-transparent hover:border-gray-400': !isActive }]"
        :style="videoBorderStyle"
      ></div>
      
      <!-- Live video element for real-time screen recording -->
      <video
        ref="videoRef"
        class="max-w-full max-h-full object-contain relative z-0"
        autoplay
        muted
        @loadedmetadata="handleVideoMetadata"
      ></video>
    </div>

    <!-- Resize and rotation handles (visible when active) -->
    <template v-if="isActive && videoReady">
      <!-- Corner handles -->
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize"
        :style="handleStyleNW"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-nw')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize"
        :style="handleStyleNE"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-ne')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize"
        :style="handleStyleSW"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-sw')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize"
        :style="handleStyleSE"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-se')"
      />

      <!-- Rotation handle -->
      <div
        class="absolute w-6 h-6 bg-green-500 border border-white cursor-grab rounded-full flex items-center justify-center"
        :style="rotateHandleStyle"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'rotate')"
      >
        <RotateCw class="w-3 h-3 text-white" />
      </div>
      
      <!-- Boutons de suppression et verrouillage -->
      <div class="absolute flex gap-1" style="top: -32px; left: 0;">
        <button
          @click.stop="emit('element-deleted', block.id)"
          class="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow transition-opacity opacity-70 hover:opacity-100"
          title="Supprimer"
        >✕</button>
        <button
          @click.stop="emit('element-updated', { id: block.id, locked: !block.locked })"
          :class="block.locked ? 'bg-yellow-400 text-zinc-900' : 'bg-zinc-700 text-white'"
          class="hover:bg-yellow-500 rounded-full w-6 h-6 flex items-center justify-center shadow transition-opacity opacity-70 hover:opacity-100"
          :title="block.locked ? 'Déverrouiller' : 'Verrouiller'"
        >
          <span v-if="block.locked">🔒</span>
          <span v-else>🔓</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { RotateCw } from 'lucide-vue-next';

// --- TYPE DEFINITIONS ---
interface ScreenRecordBlockData {
  id: string;
  type: 'screenRecord';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
}

interface CanvasSize {
  width: number;
  height: number;
}

type InteractionType = 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'rotate';

// --- PROPS ---
const props = defineProps<{
  block: ScreenRecordBlockData;
  canvasSize: CanvasSize;
  isActive: boolean;
}>();

const emit = defineEmits<{
  (e: 'interaction', event: MouseEvent, id: string, action: InteractionType): void;
  (e: 'capture-loaded', id: string, aspectRatio: number): void;
  (e: 'element-deleted', id: string): void;
  (e: 'element-updated', update: { id: string, locked: boolean }): void;
}>();

// --- REFS ---
const videoRef = ref<HTMLVideoElement | null>(null);
const videoContainerRef = ref<HTMLDivElement | null>(null);
const videoReady = ref(false);
const mediaStream = ref<MediaStream | null>(null);

// Media dimensions
const mediaBounds = ref({
  left: 0,
  top: 0,
  width: 0,
  height: 0
});

// --- UTILS ---
const ratioToPixels = (ratio: number, dimension: 'width' | 'height'): number => {
  const size = props.canvasSize[dimension];
  return ratio * size;
};

// --- COMPUTED STYLES ---
const blockStyle = computed(() => ({
  left: `${ratioToPixels(props.block.x, 'width')}px`,
  top: `${ratioToPixels(props.block.y, 'height')}px`,
  width: `${ratioToPixels(props.block.width, 'width')}px`,
  height: `${ratioToPixels(props.block.height, 'height')}px`,
  transform: `rotate(${props.block.rotation}deg)`,
  transformOrigin: 'center center',
}));

const videoBorderStyle = computed(() => ({
  left: `${mediaBounds.value.left}px`,
  top: `${mediaBounds.value.top}px`,
  width: `${mediaBounds.value.width}px`,
  height: `${mediaBounds.value.height}px`,
}));

// Computed styles for resize handles
const handleStyleNW = computed(() => ({
  left: `${mediaBounds.value.left}px`,
  top: `${mediaBounds.value.top}px`,
  transform: 'translate(-50%, -50%)',
}));

const handleStyleNE = computed(() => ({
  left: `${mediaBounds.value.left + mediaBounds.value.width}px`,
  top: `${mediaBounds.value.top}px`,
  transform: 'translate(-50%, -50%)',
}));

const handleStyleSW = computed(() => ({
  left: `${mediaBounds.value.left}px`,
  top: `${mediaBounds.value.top + mediaBounds.value.height}px`,
  transform: 'translate(-50%, -50%)',
}));

const handleStyleSE = computed(() => ({
  left: `${mediaBounds.value.left + mediaBounds.value.width}px`,
  top: `${mediaBounds.value.top + mediaBounds.value.height}px`,
  transform: 'translate(-50%, -50%)',
}));

const rotateHandleStyle = computed(() => ({
  left: '50%',
  top: `${mediaBounds.value.top - 30}px`,
  transform: 'translate(-50%, -50%)',
}));

// --- HANDLERS ---
const handleVideoMetadata = () => {
  if (!videoRef.value) return;
  
  const video = videoRef.value;
  const aspectRatio = video.videoWidth / video.videoHeight;
  
  // Emit event to update aspect ratio in parent
  emit('capture-loaded', props.block.id, aspectRatio);
  
  videoReady.value = true;
  
  // Calculate actual video dimensions
  setTimeout(updateVideoBounds, 0);
};

// Start screen recording
const startScreenRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    });
    
    mediaStream.value = stream;
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      
      // Listen for when the user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenRecording();
      });
    }
  } catch (error) {
    console.error('Error starting screen capture stream:', error);
  }
};

// Stop screen recording and clean up resources
const stopScreenRecording = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
    mediaStream.value = null;
  }
  
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
};

// Watch for changes in block dimensions to update handles
watch(() => [props.block.width, props.block.height, props.block.rotation], () => {
  if (videoReady.value) {
    // Wait for DOM to update with new dimensions
    setTimeout(updateVideoBounds, 0);
  }
});

// Start recording when component is mounted
onMounted(() => {
  startScreenRecording();
});

// Clean up resources when component is unmounted
onBeforeUnmount(() => {
  stopScreenRecording();
});

// Update the actual dimensions of video in the container
const updateVideoBounds = () => {
  if (!videoContainerRef.value || !videoRef.value) return;
  
  const video = videoRef.value;
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const videoRatio = videoWidth / videoHeight;
  
  const container = videoContainerRef.value;
  
  // Calculate actual dimensions of the video in the container
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  const containerRatio = containerWidth / containerHeight;
  
  let displayWidth, displayHeight;
  
  if (videoRatio > containerRatio) {
    // Video is limited by width
    displayWidth = containerWidth;
    displayHeight = containerWidth / videoRatio;
  } else {
    // Video is limited by height
    displayHeight = containerHeight;
    displayWidth = containerHeight * videoRatio;
  }
  
  // Calculate position of video centered in container
  const videoLeft = (containerWidth - displayWidth) / 2;
  const videoTop = (containerHeight - displayHeight) / 2;
  
  // Update dimensions for handles and borders
  mediaBounds.value = {
    left: videoLeft,
    top: videoTop,
    width: displayWidth,
    height: displayHeight
  };
};
</script>

<style scoped>
.cursor-nwse-resize { cursor: nwse-resize; }
.cursor-nesw-resize { cursor: nesw-resize; }
</style>
