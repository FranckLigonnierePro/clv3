<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  Play,
  Pause,
  Volume2,
  Share2,
  Download,
  Bookmark,
  Clock,
  Users,
  Eye,
} from "lucide-vue-next";
import Header from "../components/Header.vue";

const route = useRoute();
const webinarId = route.params.id;

const isPlaying = ref(false);
const currentTime = ref(0);
const totalDuration = ref(1320); // 22 minutes
const volume = ref(75);

const webinarData = ref({
  title: "Introduction to Vue 3 Composition API",
  description:
    "Learn the fundamentals of Vue 3's Composition API and how to build more maintainable and reusable components.",
  date: "2025-01-15T16:00:00Z",
  duration: "22 minutes",
  attendees: 128,
  views: 1547,
  thumbnail:
    "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
});

const highlights = ref([
  {
    id: 1,
    title: "What is Composition API?",
    time: 245,
    duration: 180,
    thumbnail:
      "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
  {
    id: 2,
    title: "reactive() vs ref()",
    time: 620,
    duration: 240,
    thumbnail:
      "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
  {
    id: 3,
    title: "Building Custom Composables",
    time: 890,
    duration: 300,
    thumbnail:
      "https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=300",
  },
]);

const togglePlayback = () => {
  isPlaying.value = !isPlaying.value;
};

const jumpToTime = (time: number) => {
  currentTime.value = time;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const shareWebinar = () => {
  // Implement sharing functionality
  navigator.clipboard.writeText(window.location.href);
  console.log("Link copied to clipboard");
};

const downloadWebinar = () => {
  // Implement download functionality
  console.log("Download started");
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Header />

    <main class="pt-24 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Video Area -->
          <div class="lg:col-span-2">
            <!-- Video Player -->
            <div class="card mb-6">
              <div
                class="bg-black rounded-xl overflow-hidden mb-4"
                style="aspect-ratio: 16/9"
              >
                <div class="relative w-full h-full">
                  <!-- Video Placeholder -->
                  <img
                    :src="webinarData.thumbnail"
                    :alt="webinarData.title"
                    class="w-full h-full object-cover"
                  />

                  <!-- Play Button Overlay -->
                  <div
                    v-if="!isPlaying"
                    class="absolute inset-0 flex items-center justify-center bg-black/30"
                  >
                    <button
                      @click="togglePlayback"
                      class="w-20 h-20 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105"
                    >
                      <Play class="w-8 h-8 text-gray-900 ml-1" />
                    </button>
                  </div>

                  <!-- Video Controls -->
                  <div
                    class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
                  >
                    <!-- Progress Bar -->
                    <div class="relative bg-white/20 rounded-full h-1 mb-4">
                      <div
                        class="absolute top-0 left-0 h-full bg-white rounded-full"
                        :style="{
                          width: `${(currentTime / totalDuration) * 100}%`,
                        }"
                      ></div>
                    </div>

                    <!-- Controls -->
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-4">
                        <button
                          @click="togglePlayback"
                          class="text-white hover:text-gray-300 transition-colors duration-200"
                        >
                          <Play v-if="!isPlaying" class="w-6 h-6" />
                          <Pause v-else class="w-6 h-6" />
                        </button>

                        <div
                          class="flex items-center space-x-2 text-white text-sm"
                        >
                          <span>{{ formatTime(currentTime) }}</span>
                          <span>/</span>
                          <span>{{ formatTime(totalDuration) }}</span>
                        </div>
                      </div>

                      <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                          <Volume2 class="w-5 h-5 text-white" />
                          <div class="w-20 bg-white/20 rounded-full h-1">
                            <div
                              class="h-full bg-white rounded-full"
                              :style="{ width: `${volume}%` }"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Video Info -->
            <div class="card">
              <div
                class="flex flex-col lg:flex-row lg:items-start justify-between mb-4"
              >
                <div class="flex-1">
                  <h1 class="text-2xl font-bold text-gray-900 mb-2">
                    {{ webinarData.title }}
                  </h1>
                  <p class="text-gray-600 mb-4">
                    {{ webinarData.description }}
                  </p>

                  <div
                    class="flex items-center space-x-6 text-sm text-gray-600"
                  >
                    <span class="flex items-center space-x-1">
                      <Clock class="w-4 h-4" />
                      <span>{{ formatDate(webinarData.date) }}</span>
                    </span>
                    <span class="flex items-center space-x-1">
                      <Users class="w-4 h-4" />
                      <span>{{ webinarData.attendees }} attendees</span>
                    </span>
                    <span class="flex items-center space-x-1">
                      <Eye class="w-4 h-4" />
                      <span>{{ webinarData.views }} views</span>
                    </span>
                  </div>
                </div>

                <div class="flex items-center space-x-3 mt-4 lg:mt-0">
                  <button
                    @click="shareWebinar"
                    class="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-200"
                  >
                    <Share2 class="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  <button
                    @click="downloadWebinar"
                    class="flex items-center space-x-2 btn-primary"
                  >
                    <Download class="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Highlights Sidebar -->
          <div class="lg:col-span-1">
            <div class="card">
              <h3
                class="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2"
              >
                <Bookmark class="w-5 h-5" />
                <span>Highlights</span>
              </h3>

              <div class="space-y-4">
                <div
                  v-for="highlight in highlights"
                  :key="highlight.id"
                  @click="jumpToTime(highlight.time)"
                  class="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors duration-200"
                >
                  <img
                    :src="highlight.thumbnail"
                    :alt="highlight.title"
                    class="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                  />
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900 mb-1 line-clamp-2">
                      {{ highlight.title }}
                    </h4>
                    <div
                      class="flex items-center space-x-2 text-sm text-gray-600"
                    >
                      <span>{{ formatTime(highlight.time) }}</span>
                      <span>•</span>
                      <span>{{ formatTime(highlight.duration) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Related Actions -->
            <div class="card mt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

              <div class="space-y-2">
                <router-link
                  :to="`/editor/${webinarId}`"
                  class="flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200 text-gray-900"
                >
                  <div class="p-2 bg-primary-50 rounded-xl">
                    <Edit3 class="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <div class="font-medium">Edit Recording</div>
                    <div class="text-sm text-gray-600">
                      Trim and enhance this video
                    </div>
                  </div>
                </router-link>

                <button
                  class="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200"
                >
                  <div class="p-2 bg-secondary-50 rounded-xl">
                    <Share2 class="w-4 h-4 text-secondary-600" />
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">Create Clip</div>
                    <div class="text-sm text-gray-600">
                      Share a specific moment
                    </div>
                  </div>
                </button>

                <button
                  class="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200"
                >
                  <div class="p-2 bg-accent-50 rounded-xl">
                    <Download class="w-4 h-4 text-accent-600" />
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">Export Options</div>
                    <div class="text-sm text-gray-600">
                      Download in different formats
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
