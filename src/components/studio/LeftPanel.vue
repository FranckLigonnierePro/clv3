<script setup lang="ts">
import {
  Type,
  Image as ImageIcon,
  Video as VideoIcon,
  Monitor,
  Camera,
  ChevronDown,
} from "lucide-vue-next";
import { ref } from 'vue';

defineProps({
  showPanel: {
    type: Boolean,
    default: true,
  },
  elements: {
    type: Array,
    required: true,
  },
  selectedElement: {
    type: String,
    default: null,
  },
  showGrid: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "add-text",
  "add-image",
  "add-video",
  "add-shape",
  "add-screen-record",
  "select-element",
  "toggle-grid",
  "use-camera",
]);

// State for camera dropdown
const showCameraDropdown = ref(false);
const availableCameras = ref<MediaDeviceInfo[]>([]);
const isLoadingCameras = ref(false);

// Function to get available cameras
async function fetchAvailableCameras() {
  isLoadingCameras.value = true;
  try {
    // Check if we have permission to access media devices
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Stop the stream immediately after getting permission
    stream.getTracks().forEach(track => track.stop());
    
    // Get the list of available video devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    availableCameras.value = devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error accessing camera:', error);
    availableCameras.value = [];
  } finally {
    isLoadingCameras.value = false;
  }
}

// Toggle camera dropdown and fetch cameras if needed
function toggleCameraDropdown() {
  showCameraDropdown.value = !showCameraDropdown.value;
  if (showCameraDropdown.value && availableCameras.value.length === 0) {
    fetchAvailableCameras();
  }
}

// Select a camera and emit event
function selectCamera(deviceId: string, label: string) {
  emit('use-camera', { deviceId, label });
  showCameraDropdown.value = false;
}

// Close dropdown when clicking outside
function closeDropdown() {
  showCameraDropdown.value = false;
}


</script>

<template>
    <div class="p-2 space-y-4">
      <h3 class="text-white text-xs font-semibold text-center mb-2">
        Éléments
      </h3>
      <div class="grid grid-cols-1 gap-3">
        <!-- Texte -->
        <button
          @click="$emit('add-text')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <Type class="w-5 h-5 mb-1" />
          <span class="text-xs">Texte</span>
        </button>

        <!-- Image -->
        <button
          @click="$emit('add-image')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <ImageIcon class="w-5 h-5 mb-1" />
          <span class="text-xs">Image</span>
        </button>

        <!-- Vidéo -->
        <button
          @click="$emit('add-video')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <VideoIcon class="w-5 h-5 mb-1" />
          <span class="text-xs">Vidéo</span>
        </button>
        <!-- Enregistrement d'écran -->
        <button
          @click="$emit('add-screen-record')"
          class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <Monitor class="w-5 h-5 mb-1" />
          <span class="text-xs">Enregistrement</span>
        </button>
        
        <!-- Caméra avec menu déroulant -->
        <div class="relative">
          <button
            @click="toggleCameraDropdown"
            class="w-full flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <div class="flex items-center mb-1">
              <Camera class="w-5 h-5" />
              <ChevronDown class="w-3 h-3 ml-1" />
            </div>
            <span class="text-xs">Caméra</span>
          </button>
          
          <!-- Menu déroulant des caméras disponibles -->
          <div 
            v-if="showCameraDropdown" 
            class="absolute left-0 mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg z-50"
            @click.outside="closeDropdown"
          >
            <div class="p-2">
              <h4 class="text-white text-xs font-semibold mb-2">Caméras disponibles</h4>
              
              <div v-if="isLoadingCameras" class="text-gray-400 text-xs py-2 text-center">
                Recherche des caméras...
              </div>
              
              <div v-else-if="availableCameras.length === 0" class="text-gray-400 text-xs py-2 text-center">
                Aucune caméra détectée
              </div>
              
              <ul v-else class="space-y-1">
                <li 
                  v-for="camera in availableCameras" 
                  :key="camera.deviceId"
                  @click="selectCamera(camera.deviceId, camera.label || 'Caméra ' + (availableCameras.indexOf(camera) + 1))"
                  class="text-gray-300 text-xs py-1 px-2 hover:bg-zinc-800 rounded cursor-pointer truncate"
                >
                  {{ camera.label || 'Caméra ' + (availableCameras.indexOf(camera) + 1) }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>
