<script setup lang="ts">
import { ref } from "vue";
import {
  Play,
  Square,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Link,
} from "lucide-vue-next";

interface Props {
  isLive: boolean;
  isRecording: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  audioLevel: number;
  shareUrl?: string;
}

interface Emits {
  (e: "toggle-live"): void;
  (e: "toggle-recording"): void;
  (e: "toggle-video"): void;
  (e: "toggle-audio"): void;
  (e: "toggle-video"): void;
  (e: "copy-share-link"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showShareTooltip = ref(false);

const handleToggleLive = () => {
  emit("toggle-live");
};

const handleCopyShareLink = async () => {
  if (props.shareUrl) {
    try {
      await navigator.clipboard.writeText(props.shareUrl);
      showShareTooltip.value = true;
      setTimeout(() => {
        showShareTooltip.value = false;
      }, 2000);
    } catch (err) {
      console.error("Erreur lors de la copie du lien:", err);
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = props.shareUrl || "";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        showShareTooltip.value = true;
        setTimeout(() => {
          showShareTooltip.value = false;
        }, 2000);
      } catch (err) {
        console.error("Erreur lors de la copie du lien (fallback):", err);
      }
      document.body.removeChild(textArea);
    }
  }
};
</script>

<template>
  <div class="bg-gray-800 border-t border-gray-700 p-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Left Controls -->
      <div class="flex items-center space-x-4">
        <!-- Audio Level Indicator -->
        <div class="flex items-center space-x-2">
          <Mic class="w-5 h-5 text-gray-400" />
          <div class="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 transition-all duration-100"
              :style="{ width: `${Math.min(props.audioLevel, 100)}%` }"
            ></div>
          </div>
        </div>

        <!-- Audio Toggle -->
        <button
          @click="emit('toggle-audio')"
          class="p-2 rounded-xl hover:bg-gray-700 transition-colors duration-200"
          :class="{ 'text-blue-400': props.audioEnabled }"
        >
          <Mic v-if="props.audioEnabled" class="w-5 h-5" />
          <MicOff v-else class="w-5 h-5 text-gray-500" />
        </button>

        <!-- Video Toggle -->
        <button
          @click="emit('toggle-video')"
          class="p-2 rounded-xl hover:bg-gray-700 transition-colors duration-200"
          :class="{ 'text-blue-400': props.videoEnabled }"
        >
          <Video v-if="props.videoEnabled" class="w-5 h-5" />
          <VideoOff v-else class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <!-- Center Controls -->
      <div class="flex items-center space-x-4">
        <!-- Live Toggle -->
        <div class="relative">
          <button
            @click="handleToggleLive"
            class="px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
            :class="
              props.isLive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            "
          >
            <Play v-if="!props.isLive" class="w-4 h-4" />
            <Square v-else class="w-4 h-4" />
            <span>{{ props.isLive ? "En direct" : "Démarrer le live" }}</span>
          </button>

          <!-- Bouton de partage visible uniquement en live -->
          <button
            v-if="props.isLive && props.shareUrl"
            @click="handleCopyShareLink"
            class="absolute -right-2 -top-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
            title="Copier le lien de partage"
          >
            <Link class="w-4 h-4" />
          </button>

          <div
            v-if="showShareTooltip"
            class="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap"
          >
            Lien copié !
          </div>
        </div>

        <!-- Record Toggle -->
        <button
          @click="emit('toggle-recording')"
          class="px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
          :class="
            props.isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          "
        >
          <div
            v-if="props.isRecording"
            class="w-3 h-3 bg-white rounded-full"
          ></div>
          <div v-else class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>{{
            props.isRecording ? "Arrêter l'enregistrement" : "Enregistrer"
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
