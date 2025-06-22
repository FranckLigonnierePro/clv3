<script setup lang="ts">
interface CanvasElement {
  id: string;
  type: string;
  text?: string;
  x?: number;
  y?: number;
  style?: any;
}

import { ref } from "vue";
import Canvas from "../components/studio/Canvas.vue";
import LeftPanel from "../components/studio/LeftPanel.vue";
import ChatSidebar from "../components/studio/ChatSidebar.vue";
import { Grid2X2 } from "lucide-vue-next";
import StudioFooter from "../components/studio/StudioFooter.vue";

const showGrid = ref(false);
const showChat = ref(false);
const snapEnabled = ref(true);
const elements = ref<CanvasElement[]>([]);

// Props for StudioFooter
const scenes = ref([
  { id: 1, name: 'Scène 1', active: true },
  { id: 2, name: 'Scène 2', active: false }
]);
const currentSceneId = ref(1);
const isMicrophoneOn = ref(false);
const isCameraOn = ref(false);
const isLive = ref(false);
const isRecording = ref(false);
const messages = ref([]);

function addTextElement() {
  elements.value.push({
    id: Date.now().toString(),
    type: 'text',
    text: 'nouveau texte',
    x: 100,
    y: 100,
    style: {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      align: 'center',
      fontWeight: 'bold',
    }
  });
}

const toggleChat = () => {
  showChat.value = !showChat.value;
};

function handleElementUpdated({ id, x, y, text }: { id: string, x?: number, y?: number, text?: string }) {
  const el = elements.value.find(e => e.id === id);
  if (el) {
    if (x !== undefined) el.x = x;
    if (y !== undefined) el.y = y;
    if (text !== undefined) el.text = text;
  }
}

// --- StudioFooter Handlers ---
const toggleMicrophone = () => isMicrophoneOn.value = !isMicrophoneOn.value;
const toggleCamera = () => isCameraOn.value = !isCameraOn.value;
const toggleLive = () => isLive.value = !isLive.value;
const toggleRecording = () => isRecording.value = !isRecording.value;
const changeScene = (sceneId: number) => {
  currentSceneId.value = sceneId;
  scenes.value.forEach(scene => scene.active = scene.id === sceneId);
};

const toggleSnap = () => {
  snapEnabled.value = !snapEnabled.value;
};
</script>

<template>
  <div class="h-screen bg-zinc-900">
    <div class="flex h-full overflow-hidden pb-16">
      <aside class="w-24 bg-zinc-900 text-white flex-shrink-0">
        <div>
          <LeftPanel 
            :elements="elements"
            @add-text="addTextElement"
            />
        </div>
      </aside>
      <div class="flex flex-1">
        <main class="flex-1 flex flex-col p-4 gap-4">
          <h1 class="text-3xl font-bold text-gray-800 dark:text-white flex-shrink-0">
            Ratio 16:9 Optimisé
          </h1>
          <button @click="showGrid = !showGrid" class="text-white">
            <Grid2X2 />
          </button>
          <button @click="toggleSnap" :class="{ active: snapEnabled }" class="text-white">
            Snap grille : <strong>{{ snapEnabled ? 'Activé' : 'Désactivé' }}</strong>
          </button>
          <div id="studio-canvas" class="w-full min-h-0 pb-16">
            <Canvas 
              :elements="elements"
              :showGrid="showGrid"
              :snapEnabled="snapEnabled"
              @move-element="handleMoveElement"
              @element-updated="handleElementUpdated"
            />
          </div>
        </main>

      </div>
      <ChatSidebar 
          :showChat="showChat"
          @toggle-chat="toggleChat"
        />
    </div>
    <StudioFooter 
      :scenes="scenes"
      :currentSceneId="currentSceneId"
      :isMicrophoneOn="isMicrophoneOn" :isCameraOn="isCameraOn"
      :isLive="isLive"
      :isRecording="isRecording"
      :messages="messages"
      @toggle-microphone="toggleMicrophone"
      @toggle-camera="toggleCamera"
      @toggle-live="toggleLive"
      @toggle-recording="toggleRecording"
      @change-scene="changeScene"
      @toggle-chat="toggleChat"
    />
  </div>
</template>