<script setup lang="ts">
import { 
  Video, 
  Image, 
  Monitor, 
  Type, 
  FileVideo, 
  Trash2,
  Camera,
  Settings
} from 'lucide-vue-next'

interface CanvasElement {
  id: string
  type: 'camera' | 'image' | 'screen' | 'text' | 'video'
  x: number
  y: number
  width: number
  height: number
  locked: boolean
  data: any
}

interface Props {
  isLive: boolean
  selectedElement: string | null
  currentElements: CanvasElement[]
}

interface Emits {
  (e: 'add-camera'): void
  (e: 'add-image'): void
  (e: 'add-text'): void
  (e: 'add-video'): void
  (e: 'add-screen'): void
  (e: 'delete-element'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tools = [
  {
    name: 'Camera',
    icon: Video,
    action: 'add-camera',
    description: 'Add webcam feed',
    color: 'bg-purple-500/20 text-purple-400'
  },
  {
    name: 'Image',
    icon: Image,
    action: 'add-image',
    description: 'Upload image',
    color: 'bg-blue-500/20 text-blue-400'
  },
  {
    name: 'Screen',
    icon: Monitor,
    action: 'add-screen',
    description: 'Share screen',
    color: 'bg-green-500/20 text-green-400'
  },
  {
    name: 'Text',
    icon: Type,
    action: 'add-text',
    description: 'Add text overlay',
    color: 'bg-yellow-500/20 text-yellow-400'
  },
  {
    name: 'Video',
    icon: FileVideo,
    action: 'add-video',
    description: 'Upload video',
    color: 'bg-red-500/20 text-red-400'
  }
]

const handleToolClick = (action: string) => {
  emit(action as any)
}
</script>

<template>
  <div class="w-80 bg-gray-800 border-r border-gray-700 p-6">
    <!-- Tools Section -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
        <Settings class="w-5 h-5" />
        <span>Add Elements</span>
      </h3>
      
      <div class="space-y-2">
        <button
          v-for="tool in tools"
          :key="tool.name"
          @click="handleToolClick(tool.action)"
          :disabled="isLive"
          class="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="p-2 rounded-xl" :class="tool.color">
            <component :is="tool.icon" class="w-5 h-5" />
          </div>
          <div>
            <div class="font-medium text-white">{{ tool.name }}</div>
            <div class="text-sm text-gray-400">{{ tool.description }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Selected Element Properties -->
    <div v-if="selectedElement" class="border-t border-gray-700 pt-6">
      <h4 class="font-medium text-white mb-3 flex items-center space-x-2">
        <Camera class="w-4 h-4" />
        <span>Element Properties</span>
      </h4>
      
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-400">Element ID</span>
          <span class="text-xs font-mono bg-gray-700 text-gray-300 px-2 py-1 rounded">
            {{ selectedElement.split('-')[0] }}
          </span>
        </div>
        
        <button
          @click="emit('delete-element')"
          class="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors duration-200"
        >
          <Trash2 class="w-4 h-4" />
          <span>Delete Element</span>
        </button>
      </div>
    </div>

    <!-- Elements List -->
    <div v-if="currentElements.length > 0" class="border-t border-gray-700 pt-6 mt-6">
      <h4 class="font-medium text-white mb-3">Scene Elements ({{ currentElements.length }})</h4>
      
      <div class="space-y-2 max-h-40 overflow-y-auto">
        <div
          v-for="element in currentElements"
          :key="element.id"
          class="flex items-center space-x-2 p-2 bg-gray-700/50 rounded-lg"
        >
          <component 
            :is="element.type === 'camera' ? Video : 
                 element.type === 'image' ? Image :
                 element.type === 'screen' ? Monitor :
                 element.type === 'text' ? Type : FileVideo"
            class="w-4 h-4 text-gray-400"
          />
          <span class="text-sm text-gray-300 flex-1 truncate">
            {{ element.type.charAt(0).toUpperCase() + element.type.slice(1) }}
          </span>
          <div v-if="element.locked" class="w-2 h-2 bg-yellow-500 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>