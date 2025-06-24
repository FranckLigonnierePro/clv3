<template>
  <div
    class="absolute cursor-move select-none"
    :style="blockStyle"
    @mousedown.stop="emit('interaction', $event, block.id, 'move')"
  >
    <!-- Screen capture container -->
    <div ref="captureContainerRef" class="w-full h-full flex items-center justify-center overflow-hidden">
      <!-- Border overlay that adapts to screen capture dimensions -->
      <div 
        v-if="mediaReady"
        :class="['absolute', { 'border-2 border-blue-500 z-10': isActive, 'border-2 border-transparent hover:border-gray-400': !isActive }]"
        :style="captureBorderStyle"
      ></div>
      
      <!-- Live video element for real-time screen capture -->
      <video
        v-if="isStreaming"
        ref="videoRef"
        class="max-w-full max-h-full object-contain relative z-0"
        autoplay
        muted
        @loadedmetadata="handleVideoMetadata"
      ></video>
    </div>

    <!-- Poignées de redimensionnement et rotation (visibles si le bloc est actif) -->
    <template v-if="isActive && captureLoaded">
      <!-- Poignées d'angle adaptées à la capture -->
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { RotateCw, Monitor, RefreshCcw, Play, Square, Camera } from 'lucide-vue-next';

// --- TYPE DEFINITIONS ---
interface ScreenCaptureBlockData {
  id: string;
  type: 'screenCapture';
  src: string;
  alt?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

const props = defineProps<{
  block: ScreenCaptureBlockData;
  canvasSize: { width: number; height: number };
  isActive: boolean;
}>();

const emit = defineEmits<{
  (e: 'interaction', event: MouseEvent, id: string, action: string): void;
  (e: 'capture-loaded', id: string, aspectRatio: number): void;
  (e: 'refreshCapture', id: string): void;
  (e: 'update-source', id: string, src: string): void;
}>();

// Refs
const captureRef = ref<HTMLImageElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const captureContainerRef = ref<HTMLDivElement | null>(null);
const captureLoaded = ref(false);

// Media dimensions
const mediaBounds = ref({
  left: 0,
  top: 0,
  width: 0,
  height: 0
});

// Streaming state
const isStreaming = ref(false);
const mediaStream = ref<MediaStream | null>(null);
const mediaReady = computed(() => captureLoaded.value || isStreaming.value);

// Computed styles
const blockStyle = computed(() => {
  const { x, y, width, height, rotation = 0 } = props.block;
  return {
    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
    width: `${width}px`,
    height: `${height}px`,
  };
});

const captureBorderStyle = computed(() => {
  return {
    left: `${mediaBounds.value.left}px`,
    top: `${mediaBounds.value.top}px`,
    width: `${mediaBounds.value.width}px`,
    height: `${mediaBounds.value.height}px`,
  };
});

const badgeStyle = computed(() => ({
  left: `${mediaBounds.value.left}px`,
  transform: 'translateY(-50%)',
  zIndex: 20,
}));

// Computed styles for resize handles
const handleStyleNW = computed(() => ({
  transform: 'translate(-50%, -50%)',
}));

const handleStyleNE = computed(() => ({
  transform: 'translate(50%, -50%)',
}));

const handleStyleSW = computed(() => ({
  transform: 'translate(-50%, 50%)',
}));

const handleStyleSE = computed(() => ({
  transform: 'translate(50%, 50%)',
}));

const rotateHandleStyle = computed(() => ({
  transform: 'translate(-50%, -50%)',
  top: '-30px',
  left: '50%',
}));

// --- HANDLERS ---
const handleCaptureLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  if (!img) return;
  
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  
  // Emit event to update aspect ratio in parent
  emit('capture-loaded', props.block.id, aspectRatio);
  
  captureLoaded.value = true;
  
  // Calculate actual capture dimensions after loading
  setTimeout(updateMediaBounds, 0);
};

const handleVideoMetadata = () => {
  if (!videoRef.value) return;
  
  const video = videoRef.value;
  const aspectRatio = video.videoWidth / video.videoHeight;
  
  // Emit event to update aspect ratio in parent
  emit('capture-loaded', props.block.id, aspectRatio);
  
  // Calculate actual video dimensions
  setTimeout(updateMediaBounds, 0);
};

// Function to trigger a new screen capture
const refreshCapture = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  emit('refreshCapture', props.block.id);
};

// Toggle streaming on/off
const toggleStreaming = async () => {
  if (isStreaming.value) {
    // Stop streaming
    stopStreaming();
  } else {
    // Start streaming
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      mediaStream.value = stream;
      
      if (videoRef.value) {
        videoRef.value.srcObject = stream;
        isStreaming.value = true;
        
        // Listen for when the user stops sharing via browser UI
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          stopStreaming();
        });
      }
    } catch (error) {
      console.error('Error starting screen capture stream:', error);
    }
  }
};

// Stop streaming and clean up resources
const stopStreaming = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
    mediaStream.value = null;
  }
  
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  
  isStreaming.value = false;
};

// Take a snapshot from the current video stream
const takeSnapshot = () => {
  if (!videoRef.value || !isStreaming.value) return;
  
  const video = videoRef.value;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Draw the current video frame to the canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/png');
  
  // Update the block's source with the snapshot
  emit('update-source', props.block.id, dataUrl);
  
  // Stop streaming after taking snapshot
  stopStreaming();
};

// Watch for changes in block dimensions to update handles
watch(() => [props.block.width, props.block.height, props.block.rotation], () => {
  if (mediaReady.value) {
    // Wait for DOM to update with new dimensions
    setTimeout(updateMediaBounds, 0);
  }
});

// Ensure handles are updated after component mount
onMounted(() => {
  if (captureRef.value && captureRef.value.complete) {
    // If image is already loaded from cache
    captureLoaded.value = true;
    setTimeout(updateMediaBounds, 0);
  }
});

// Clean up resources when component is unmounted
onBeforeUnmount(() => {
  stopStreaming();
});

// Update the actual dimensions of media in the container
const updateMediaBounds = () => {
  if (!captureContainerRef.value) return;
  
  let mediaWidth = 0;
  let mediaHeight = 0;
  let mediaRatio = 1;
  
  // Get dimensions from either video or image
  if (isStreaming.value && videoRef.value) {
    const video = videoRef.value;
    mediaWidth = video.videoWidth;
    mediaHeight = video.videoHeight;
    mediaRatio = mediaWidth / mediaHeight;
  } else if (captureRef.value) {
    const img = captureRef.value;
    mediaWidth = img.naturalWidth;
    mediaHeight = img.naturalHeight;
    mediaRatio = mediaWidth / mediaHeight;
  } else {
    return;
  }
  
  const container = captureContainerRef.value;
  
  // Calculate actual dimensions of the media in the container
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  const containerRatio = containerWidth / containerHeight;
  
  let displayWidth, displayHeight;
  
  if (mediaRatio > containerRatio) {
    // Media is limited by width
    displayWidth = containerWidth;
    displayHeight = containerWidth / mediaRatio;
  } else {
    // Media is limited by height
    displayHeight = containerHeight;
    displayWidth = containerHeight * mediaRatio;
  }
  
  // Calculate position of media centered in container
  const mediaLeft = (containerWidth - displayWidth) / 2;
  const mediaTop = (containerHeight - displayHeight) / 2;
  
  // Update dimensions for handles and borders
  mediaBounds.value = {
    left: mediaLeft,
    top: mediaTop,
    width: displayWidth,
    height: displayHeight
  };
};

</script>

<style scoped>
.cursor-nwse-resize { cursor: nwse-resize; }
.cursor-nesw-resize { cursor: nesw-resize; }
</style>
