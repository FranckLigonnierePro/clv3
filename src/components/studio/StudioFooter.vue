<script setup lang="ts">
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Radio,
  Circle,
  MessageCircle,
  CircleDot,
  LayoutGrid,
  Check
} from "lucide-vue-next";
import { ref } from 'vue';

defineProps({
  scenes: {
    type: Array as () => Array<{id: number, name: string, active: boolean}>,
    required: true
  },
  currentSceneId: {
    type: Number,
    required: true
  },
  isMicrophoneOn: {
    type: Boolean,
    default: false,
  },
  isCameraOn: {
    type: Boolean,
    default: false,
  },
  isLive: {
    type: Boolean,
    default: false,
  },
  isRecording: {
    type: Boolean,
    default: false,
  },
  messages: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  'toggle-microphone',
  'toggle-camera',
  'toggle-live',
  'toggle-recording',
  'toggle-chat',
  'change-scene'
]);

const showScenesMenu = ref(false);
const menuTimeout = ref<number | null>(null);

const handleSceneSelect = (sceneId: number) => {
  emit('change-scene', sceneId);
  closeMenu();
};

// Pas de fonction d'ajout de scène - 4 scènes fixes

const closeMenu = () => {
  if (menuTimeout.value) {
    clearTimeout(menuTimeout.value);
  }
  showScenesMenu.value = false;
};

const handleMenuBlur = () => {
  menuTimeout.value = window.setTimeout(() => {
    closeMenu();
  }, 150);
};
</script>

<template>
  <footer class="fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 text-white flex items-center justify-center shadow-lg">
    <div class="flex items-center justify-center gap-4">
      <!-- Microphone -->
      <button
        class="w-16 flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        :class="{ 'bg-blue-500/20 text-blue-400': isMicrophoneOn }"
        @click="$emit('toggle-microphone')"
        title="Microphone"
      >
        <component :is="isMicrophoneOn ? Mic : MicOff" class="w-5 h-5 mb-1" />
      </button>
      
      <!-- Camera -->
      <button
        class="w-16 flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        :class="{ 'bg-blue-500/20 text-blue-400': isCameraOn }"
        @click="$emit('toggle-camera')"
        title="Caméra"
      >
        <component :is="isCameraOn ? Video : VideoOff" class="w-5 h-5 mb-1" />
        <span class="text-xs">Caméra</span>
      </button>

      <!-- Live -->
      <button
        class="w-16 flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        :class="{ 'bg-red-500/20 text-red-400': isLive }"
        @click="$emit('toggle-live')"
        title="Mode Live"
      >
        <Radio :class="['w-5 h-5 mb-1', { 'text-red-500': isLive }]" />
        <span class="text-xs">Live</span>
      </button>

      <!-- Enregistrement -->
      <button
        class="w-24 flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
        :class="{ 'bg-red-500/20 text-red-400': isRecording }"
        @click="$emit('toggle-recording')"
        :title="isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'"
      >
        <component :is="isRecording ? CircleDot : Circle" class="w-5 h-5 mb-1" />
        <span class="text-xs">{{ isRecording ? 'En cours...' : 'Enregistrer' }}</span>
      </button>

      <!-- Bouton Scènes -->
      <div class="relative">
        <button
          class="w-16 flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors"
          :class="{ 'bg-blue-500/20 text-blue-400': showScenesMenu }"
          @click="showScenesMenu = !showScenesMenu"
          title="Gérer les scènes"
          @blur="handleMenuBlur"
        >
          <LayoutGrid class="w-5 h-5 mb-1" />
          <span class="text-xs">Scènes</span>
        </button>

        <!-- Menu déroulant des scènes -->
        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div 
            v-if="showScenesMenu"
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-md shadow-lg bg-zinc-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 py-1"
          >
            <div class="px-3 py-2 text-xs text-gray-400 border-b border-zinc-700">
              Scènes
            </div>
            <div class="max-h-60 overflow-y-auto">
              <button
                v-for="scene in scenes"
                :key="scene.id"
                @click="handleSceneSelect(scene.id)"
                class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-zinc-700 flex items-center justify-between"
                :class="{ 'bg-blue-500/20 text-blue-400': scene.id === currentSceneId }"
              >
                <span class="truncate">{{ scene.name }}</span>
                <Check v-if="scene.id === currentSceneId" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Chat -->
      <button
        class="w-16 flex flex-col items-center justify-center p-2 text-gray-300 hover:bg-zinc-800 rounded-xl transition-colors relative"
        :class="{ 'bg-blue-500/20 text-blue-400': messages.length > 0 }"
        @click="$emit('toggle-chat')"
        title="Ouvrir le chat"
      >
        <MessageCircle :class="['w-5 h-5 mb-1', { 'text-blue-400': messages.length > 0 }]" />
        <span class="text-xs">Chat</span>
        <span 
          v-if="messages.length > 0" 
          class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center"
        >
          {{ messages.length }}
        </span>
      </button>
    </div>
  </footer>
</template>

<style scoped>
.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
