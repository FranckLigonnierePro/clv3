<script setup lang="ts">
import { ref } from "vue";
import { X, Send } from "lucide-vue-next";

defineProps<{
  showChat: boolean;
  messages: Array<{
    id: string;
    text: string;
    sender: string;
    time: string;
  }>;
}>();

const emit = defineEmits(["toggle-chat", "send-message"]);

const newMessage = ref("");

const sendMessage = () => {
  if (newMessage.value.trim()) {
    emit("send-message", newMessage.value);
    newMessage.value = "";
  }
};
</script>

<template>
  <aside class="bg-zinc-800 rounded-s-xl transition-all duration-300 ease-in-out flex-shrink-0 h-full flex flex-col" :class="showChat ? 'block w-80' : 'hidden w-0'">
    <div class="flex items-center justify-between p-4 border-b border-zinc-800">
      <h3 class="text-white font-semibold">Chat en direct</h3>
      <button
        class="text-zinc-400 hover:text-white focus:outline-none"
        @click="$emit('toggle-chat')"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto chat-messages px-4 py-2 flex flex-col gap-2">
      <div
        v-for="message in messages"
        :key="message.id"
        class="max-w-xs px-3 py-2 rounded-lg shadow"
        :class="
          message.sender === 'user'
            ? 'ml-auto bg-blue-600 text-white'
            : 'mr-auto bg-zinc-800 text-white'
        "
      >
        <div class="text-sm">{{ message.text }}</div>
        <div class="text-xs opacity-70 mt-1 text-right">{{ message.time }}</div>
      </div>
    </div>

    <div class="p-4 border-t border-zinc-800">
      <form @submit.prevent="sendMessage" class="relative">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Écrire un message..."
          class="w-full bg-zinc-700 text-white rounded-xl px-5 py-2 pr-12 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        />
        <button
          type="submit"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 hover:text-violet-700 focus:outline-none"
        >
          <Send class="h-6 w-6" />
        </button>
      </form>
    </div>
  </aside>
</template>

<style scoped>
/* Chat styles */
.chat-messages {
  scrollbar-width: thin;
  scrollbar-color: #3f3f46 #1f2937;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #1f2937;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 3px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-messages > div {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
