<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

defineProps<{
  showChat: boolean
  messages: Array<{
    id: string
    text: string
    sender: string
    time: string
  }>
}>()

const emit = defineEmits(['toggle-chat', 'send-message'])

const newMessage = ref('')

const sendMessage = () => {
  if (newMessage.value.trim()) {
    emit('send-message', newMessage.value)
    newMessage.value = ''
  }
}
</script>

<template>
  <div 
    class="right-0 top-0 h-full bg-zinc-900 border-l border-zinc-800 transition-all duration-300 ease-in-out z-40 flex flex-col"
    :class="showChat ? 'w-80' : 'w-0 opacity-0'"
  >
    <div class="flex items-center justify-between p-4 border-b border-zinc-800">
      <h3 class="text-white font-semibold">Chat en direct</h3>
      <button @click="$emit('toggle-chat')" class="text-zinc-400 hover:text-white">
        <X class="w-5 h-5" />
      </button>
    </div>
    
    <div class="chat-messages flex-1 overflow-y-auto p-4 space-y-3">
      <div 
        v-for="message in messages" 
        :key="message.id" 
        class="p-3 rounded-lg max-w-[80%]"
        :class="message.sender === 'user' ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-zinc-800 text-white'"
      >
        <div class="text-sm">{{ message.text }}</div>
        <div class="text-xs opacity-70 mt-1 text-right">{{ message.time }}</div>
      </div>
    </div>
    
    <div class="p-4 border-t border-zinc-800">
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Écrire un message..."
          class="flex-1 bg-zinc-800 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Envoyer
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.chat-messages {
  scrollbar-width: thin;
  scrollbar-color: #3f3f46 #27272a;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #27272a;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 3px;
}
</style>
