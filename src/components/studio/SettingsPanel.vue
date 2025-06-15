<script setup lang="ts">
import { X, Camera, Mic, Monitor } from "lucide-vue-next";

interface Props {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  selectedCamera: string;
  selectedMicrophone: string;
  cameraStream: MediaStream | null;
  audioLevel: number;
}

interface Emits {
  (e: "close"): void;
  (e: "camera-change", deviceId: string): void;
  (e: "microphone-change", deviceId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
  >
    <!-- Panel -->
    <div
      class="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl mx-4"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white">Studio Settings</h2>
        <button
          @click="emit('close')"
          class="p-2 hover:bg-gray-700 rounded-xl transition-colors duration-200"
        >
          <X class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Camera Settings -->
        <div class="space-y-4">
          <h3
            class="text-lg font-semibold text-white flex items-center space-x-2"
          >
            <Camera class="w-5 h-5" />
            <span>Camera</span>
          </h3>

          <!-- Camera Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Camera Source</label
            >
            <select
              :value="selectedCamera"
              @change="
                emit(
                  'camera-change',
                  ($event.target as HTMLSelectElement).value,
                )
              "
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select Camera</option>
              <option
                v-for="camera in cameras"
                :key="camera.deviceId"
                :value="camera.deviceId"
              >
                {{ camera.label || `Camera ${camera.deviceId.slice(0, 8)}` }}
              </option>
            </select>
          </div>

          <!-- Camera Preview -->
          <div
            class="bg-black rounded-xl overflow-hidden"
            style="aspect-ratio: 16/9"
          >
            <video
              v-if="cameraStream"
              :srcObject="cameraStream"
              autoplay
              muted
              class="w-full h-full object-cover"
            ></video>
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-400"
            >
              <div class="text-center">
                <Camera class="w-12 h-12 mx-auto mb-2" />
                <p class="text-sm">No camera preview</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Audio Settings -->
        <div class="space-y-4">
          <h3
            class="text-lg font-semibold text-white flex items-center space-x-2"
          >
            <Mic class="w-5 h-5" />
            <span>Audio</span>
          </h3>

          <!-- Microphone Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Microphone Source</label
            >
            <select
              :value="selectedMicrophone"
              @change="
                emit(
                  'microphone-change',
                  ($event.target as HTMLSelectElement).value,
                )
              "
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select Microphone</option>
              <option
                v-for="microphone in microphones"
                :key="microphone.deviceId"
                :value="microphone.deviceId"
              >
                {{
                  microphone.label ||
                  `Microphone ${microphone.deviceId.slice(0, 8)}`
                }}
              </option>
            </select>
          </div>

          <!-- Audio Level Meter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2"
              >Audio Level</label
            >
            <div class="bg-gray-700 rounded-xl p-4">
              <div class="flex items-center space-x-3">
                <Mic class="w-5 h-5 text-gray-400" />
                <div
                  class="flex-1 bg-gray-600 rounded-full h-3 overflow-hidden"
                >
                  <div
                    class="h-full transition-all duration-100"
                    :class="
                      audioLevel > 70
                        ? 'bg-red-500'
                        : audioLevel > 40
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    "
                    :style="{ width: `${audioLevel}%` }"
                  ></div>
                </div>
                <span class="text-sm text-gray-400 w-12"
                  >{{ Math.round(audioLevel) }}%</span
                >
              </div>
            </div>
          </div>

          <!-- Audio Test -->
          <div class="bg-gray-700 rounded-xl p-4">
            <h4 class="font-medium text-white mb-2">Audio Test</h4>
            <p class="text-sm text-gray-400 mb-3">
              Speak into your microphone to test the audio level.
            </p>
            <div class="text-xs text-gray-500">
              Optimal level: 40-70% • Avoid red zone to prevent distortion
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end mt-6 pt-6 border-t border-gray-700">
        <button
          @click="emit('close')"
          class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors duration-200"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>
