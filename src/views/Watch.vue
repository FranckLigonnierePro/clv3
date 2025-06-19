<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <!-- En-tête -->
    <header class="mb-6 text-center">
      <div class="flex justify-between items-center mb-2">
        <h1 class="text-2xl font-bold">ClipLive - Visionnage</h1>
        <div class="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span class="text-sm">{{ viewerCount }} spectateur{{ viewerCount !== 1 ? 's' : '' }}</span>
        </div>
      </div>
      <p v-if="roomName" class="text-gray-400">
        {{ roomNameDisplay || `Salle: ${roomName}` }}
      </p>
    </header>

    <div class="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
      <!-- Lecteur vidéo -->
      <div class="lg:w-2/3">
        <div class="bg-black rounded-xl overflow-hidden">
          <div class="relative w-full aspect-video bg-black">
            <video
              ref="videoRef"
              autoplay
              playsinline
              muted
              class="w-full h-full"
            ></video>
            <!-- État de chargement -->
            <div
              v-if="!isLive"
              class="absolute inset-0 flex items-center justify-center bg-black/50"
            >
              <div class="text-center">
                <div
                  class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"
                ></div>
                <p class="mt-2 text-white">En attente du flux vidéo...</p>
              </div>
            </div>
            <!-- Indicateur EN DIRECT -->
            <div
              v-if="isLive"
              class="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full text-sm font-medium"
            >
              EN DIRECT
            </div>
          </div>
        </div>
      </div>

      <!-- Chat -->
      <div class="lg:w-1/3 bg-gray-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
        <div class="p-4 border-b border-gray-700">
          <h2 class="text-lg font-semibold">Chat en direct</h2>
        </div>
        <!-- Messages -->
        <div 
          ref="chatScrollRef" 
          class="flex-1 overflow-y-auto p-4 space-y-3"
        >
          <div 
            v-for="(message, index) in chatMessages" 
            :key="message.id"
            class="flex chat-message"
            :class="{ 'justify-end': message.isCurrentUser }"
          >
            <div 
              class="max-w-[80%] rounded-lg px-4 py-2"
              :class="message.isCurrentUser 
                ? 'bg-blue-600 rounded-br-none' 
                : 'bg-gray-700 rounded-bl-none'"
            >
              <div class="text-xs text-gray-300 mb-1">
                {{ message.username }}
              </div>
              <div class="break-words">
                {{ message.text }}
              </div>
              <div class="text-xs text-gray-400 text-right mt-1">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
        </div>
        <!-- Input message -->
        <div class="p-4 border-t border-gray-700">
          <form @submit.prevent="sendMessage" class="flex gap-2">
            <input
              v-model="newMessage"
              type="text"
              placeholder="Écrire un message..."
              class="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :disabled="!isConnected"
            />
            <button
              type="submit"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              :disabled="!isConnected || !newMessage.trim()"
            >
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div
      v-if="error"
      class="mt-4 p-4 bg-red-900/50 text-red-200 rounded-lg max-w-2xl mx-auto"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { Room, RemoteParticipant, RemoteTrack, RemoteTrackPublication } from "livekit-client";

// Types
type ChatMessage = {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isCurrentUser: boolean;
};

const route = useRoute();
const videoRef = ref<HTMLVideoElement | null>(null);
const chatScrollRef = ref<HTMLElement | null>(null);
const room = ref<Room | null>(null);
const isLive = ref(false);
const error = ref("");
const roomName = ref("");
const roomNameDisplay = ref("");
const viewerCount = ref(0);
const newMessage = ref("");
const chatMessages = reactive<ChatMessage[]>([]);
const isConnected = ref(false);
const username = ref(`Spectateur-${Math.floor(Math.random() * 10000)}`);

// Format l'heure pour les messages
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
    }
  });
};

const sendMessage = () => {
  if (!newMessage.value.trim() || !room.value) return;

  const message: ChatMessage = {
    id: Date.now().toString(),
    username: username.value,
    text: newMessage.value,
    timestamp: Date.now(),
    isCurrentUser: true
  };

  // Ajout instantané côté client (avant publishData)
  chatMessages.push(message);
  scrollToBottom();

  // Publier le message via LiveKit DataChannel
  try {
    const encoder = new TextEncoder();
    const messageToSend = {
      type: 'chat-message',
      data: {
        id: message.id,
        username: message.username,
        text: message.text,
        timestamp: message.timestamp
      }
    };
    room.value.localParticipant.publishData(encoder.encode(JSON.stringify(messageToSend)), { reliable: true });
    newMessage.value = '';
  } catch (err) {
    console.error('Erreur lors de l\'envoi du message:', err);
  }
};

// Messages entrants
const handleData = (data: Uint8Array, participant?: RemoteParticipant) => {
  try {
    const decoder = new TextDecoder();
    const rawMessage = decoder.decode(data);
    const message = JSON.parse(rawMessage);

    if (message.type === 'chat-message') {
      const chatMessage: ChatMessage = {
        id: message.data.id || Date.now().toString(),
        username: message.data.username || 'Anonyme',
        text: message.data.text,
        timestamp: message.data.timestamp || Date.now(),
        isCurrentUser: message.data.username === username.value
      };
      chatMessages.push(chatMessage);
      scrollToBottom();
    }
  } catch (err) {
    console.error('Erreur lors du traitement du message:', err);
  }
};

// Fonction de nettoyage
const cleanup = () => {
  if (room.value) {
    room.value.disconnect();
    room.value = null;
  }
  isLive.value = false;
  isConnected.value = false;
};

// ... LE RESTE DE TON CODE pour la gestion vidéo/LiveKit est inchangé ...

// Pour éviter une réponse trop longue, tu peux reprendre le reste de ton script original pour :  
// - updateViewerCount()
// - setupRoomEvents()
// - setupParticipantEvents()
// - handleTrackSubscribed()
// - connectToRoom()
// - handleInteraction()
// - onMounted()/onUnmounted()
// etc.

// Les morceaux critiques pour le chat sont ici :  
// -> Ajout direct côté client (avant publishData)  
// -> scrollToBottom après push  
// -> username relié à l’input, clé id pour les messages

</script>

<style scoped>
video {
  background-color: #000;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
/* Animation d'apparition des messages */
.chat-message {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Scrollbar custom */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #2d3748;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb {
  background: #4a5568;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style>
