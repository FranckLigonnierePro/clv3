<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Scissors,
  Type,
  Download,
  Save,
  Undo,
  Redo,
} from "lucide-vue-next";
import Header from "../components/Header.vue";

const route = useRoute();
const webinarId = route.params.id;

const isPlaying = ref(false);
const currentTime = ref(245); // seconds
const totalDuration = ref(1320); // 22 minutes
const selectedClip = ref(null);

const timeline = ref([
  { id: 1, type: "video", start: 0, duration: 600, title: "Introduction" },
  { id: 2, type: "marker", start: 245, title: "Key Point" },
  { id: 3, type: "video", start: 600, duration: 420, title: "Main Content" },
  { id: 4, type: "marker", start: 890, title: "Q&A Start" },
  { id: 5, type: "video", start: 1020, duration: 300, title: "Conclusion" },
]);

const tools = [
  { name: "Trim", icon: Scissors, action: "trim" },
  { name: "Add Title", icon: Type, action: "title" },
  { name: "Save", icon: Save, action: "save" },
  { name: "Export", icon: Download, action: "export" },
];

const togglePlayback = () => {
  isPlaying.value = !isPlaying.value;
};

const seekBackward = () => {
  currentTime.value = Math.max(0, currentTime.value - 10);
};

const seekForward = () => {
  currentTime.value = Math.min(totalDuration.value, currentTime.value + 10);
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getTimelinePosition = (start: number) => {
  return (start / totalDuration.value) * 100;
};

const getTimelineWidth = (duration: number) => {
  return (duration / totalDuration.value) * 100;
};

const handleToolAction = (action: string) => {
  console.log(`Tool action: ${action}`);
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Header />

    <main class="pt-24 pb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Video Editor</h1>
            <p class="text-gray-600">Edit and enhance your recorded webinar</p>
          </div>

          <div class="flex items-center space-x-2">
            <button
              class="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              title="Undo"
            >
              <Undo class="w-5 h-5 text-gray-600" />
            </button>
            <button
              class="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              title="Redo"
            >
              <Redo class="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Video Preview -->
          <div class="lg:col-span-3">
            <div class="card mb-6">
              <!-- Video Player -->
              <div
                class="bg-black rounded-xl overflow-hidden mb-4"
                style="aspect-ratio: 16/9"
              >
                <div
                  class="w-full h-full flex items-center justify-center text-white/60"
                >
                  <div class="text-center">
                    <Play class="w-16 h-16 mx-auto mb-4" />
                    <p>Video Preview</p>
                    <p class="text-sm opacity-75">
                      Introduction to Vue 3 Composition API
                    </p>
                  </div>
                </div>
              </div>

              <!-- Video Controls -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <button
                    @click="seekBackward"
                    class="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    <SkipBack class="w-5 h-5 text-gray-600" />
                  </button>

                  <button
                    @click="togglePlayback"
                    class="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors duration-200"
                  >
                    <Play v-if="!isPlaying" class="w-5 h-5" />
                    <Pause v-else class="w-5 h-5" />
                  </button>

                  <button
                    @click="seekForward"
                    class="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    <SkipForward class="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div class="flex items-center space-x-4">
                  <span class="text-sm text-gray-600">
                    {{ formatTime(currentTime) }} /
                    {{ formatTime(totalDuration) }}
                  </span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="relative bg-gray-200 rounded-full h-2 mb-6">
                <div
                  class="absolute top-0 left-0 h-full bg-primary-600 rounded-full"
                  :style="{ width: `${(currentTime / totalDuration) * 100}%` }"
                ></div>
                <div
                  class="absolute top-1/2 w-4 h-4 bg-primary-600 rounded-full transform -translate-y-1/2 -translate-x-1/2 cursor-pointer"
                  :style="{ left: `${(currentTime / totalDuration) * 100}%` }"
                ></div>
              </div>
            </div>

            <!-- Timeline -->
            <div class="card">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>

              <div class="relative bg-gray-100 rounded-xl p-4 h-32">
                <!-- Timeline Items -->
                <div
                  v-for="item in timeline"
                  :key="item.id"
                  class="absolute top-4 rounded-lg transition-all duration-200 cursor-pointer"
                  :class="
                    item.type === 'video'
                      ? 'bg-primary-200 border-2 border-primary-300 h-16'
                      : 'bg-yellow-400 w-2 h-20'
                  "
                  :style="{
                    left: `${getTimelinePosition(item.start)}%`,
                    width:
                      item.type === 'video'
                        ? `${getTimelineWidth(item.duration)}%`
                        : '2px',
                  }"
                  @click="selectedClip = item"
                >
                  <div
                    v-if="item.type === 'video'"
                    class="p-2 h-full flex items-center"
                  >
                    <span
                      class="text-xs font-medium text-primary-800 truncate"
                      >{{ item.title }}</span
                    >
                  </div>
                  <div v-else class="relative">
                    <div
                      class="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded whitespace-nowrap"
                    >
                      {{ item.title }}
                    </div>
                  </div>
                </div>

                <!-- Current Time Indicator -->
                <div
                  class="absolute top-0 bottom-0 w-0.5 bg-red-500"
                  :style="{ left: `${(currentTime / totalDuration) * 100}%` }"
                >
                  <div
                    class="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full"
                  ></div>
                </div>
              </div>

              <!-- Timeline Controls -->
              <div class="flex items-center justify-between mt-4">
                <div class="text-sm text-gray-600">
                  Drag to rearrange clips • Click markers to jump to moments
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-500">Zoom:</span>
                  <button
                    class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
                  >
                    -
                  </button>
                  <button
                    class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tools Sidebar -->
          <div class="lg:col-span-1">
            <div class="card">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Editing Tools
              </h3>

              <div class="space-y-2">
                <button
                  v-for="tool in tools"
                  :key="tool.name"
                  @click="handleToolAction(tool.action)"
                  class="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200"
                >
                  <component :is="tool.icon" class="w-5 h-5 text-gray-600" />
                  <span class="font-medium text-gray-900">{{ tool.name }}</span>
                </button>
              </div>
            </div>

            <!-- Clip Details -->
            <div v-if="selectedClip" class="card mt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Clip Details
              </h3>

              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Title</label
                  >
                  <input
                    type="text"
                    :value="selectedClip.title"
                    class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div v-if="selectedClip.type === 'video'">
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Duration</label
                  >
                  <input
                    type="text"
                    :value="formatTime(selectedClip.duration)"
                    readonly
                    class="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Start Time</label
                  >
                  <input
                    type="text"
                    :value="formatTime(selectedClip.start)"
                    readonly
                    class="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50"
                  />
                </div>

                <button class="w-full btn-primary">Apply Changes</button>
              </div>
            </div>

            <!-- Export Options -->
            <div class="card mt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Export</h3>

              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Quality</label
                  >
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option>1080p (Recommended)</option>
                    <option>720p</option>
                    <option>480p</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Format</label
                  >
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option>MP4</option>
                    <option>WebM</option>
                    <option>MOV</option>
                  </select>
                </div>

                <button
                  class="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Download class="w-4 h-4" />
                  <span>Export Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
