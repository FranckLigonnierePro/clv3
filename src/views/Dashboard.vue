<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, Play, Edit3, Download, Calendar, Clock, Users, Video, Settings } from 'lucide-vue-next'
import Header from '../components/Header.vue'

const webinars = ref([
  {
    id: 1,
    title: 'Introduction to Vue 3 Composition API',
    status: 'upcoming',
    date: '2025-01-20T14:00:00Z',
    duration: null,
    attendees: 45,
    thumbnail: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 2,
    title: 'Building Modern Web Applications',
    status: 'ended',
    date: '2025-01-15T16:00:00Z',
    duration: '1h 32m',
    attendees: 128,
    thumbnail: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 3,
    title: 'TypeScript Best Practices Workshop',
    status: 'ended',
    date: '2025-01-10T18:00:00Z',
    duration: '2h 15m',
    attendees: 89,
    thumbnail: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
])

const getStatusColor = (status: string) => {
  return status === 'upcoming' 
    ? 'bg-accent-50 text-accent-600 border-accent-200' 
    : 'bg-gray-50 text-gray-600 border-gray-200'
}

const getStatusIcon = (status: string) => {
  return status === 'upcoming' ? Clock : Video
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const createNewWebinar = () => {
  // Generate a new webinar ID and navigate to studio
  const newId = Date.now()
  // In a real app, this would create a new webinar record
  console.log('Creating new webinar:', newId)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Header />
    
    <main class="pt-24 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p class="text-gray-600">Manage your webinars and recordings</p>
          </div>
          <RouterLink 
            to="/studio/new"
            class="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
          >
            <Plus class="w-5 h-5" />
            <span>New Webinar</span>
          </RouterLink>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Total Webinars</p>
                <p class="text-2xl font-bold text-gray-900">{{ webinars.length }}</p>
              </div>
              <div class="p-3 bg-primary-50 rounded-xl">
                <Video class="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Total Attendees</p>
                <p class="text-2xl font-bold text-gray-900">262</p>
              </div>
              <div class="p-3 bg-secondary-50 rounded-xl">
                <Users class="w-6 h-6 text-secondary-600" />
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Upcoming</p>
                <p class="text-2xl font-bold text-gray-900">1</p>
              </div>
              <div class="p-3 bg-accent-50 rounded-xl">
                <Calendar class="w-6 h-6 text-accent-600" />
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Total Hours</p>
                <p class="text-2xl font-bold text-gray-900">3h 47m</p>
              </div>
              <div class="p-3 bg-warning-50 rounded-xl">
                <Clock class="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </div>
        </div>

        <!-- Webinars List -->
        <div class="card">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Your Webinars</h2>
            <div class="flex items-center space-x-2">
              <button class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
                All
              </button>
              <button class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
                Upcoming
              </button>
              <button class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200">
                Ended
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="webinar in webinars"
              :key="webinar.id"
              class="flex flex-col lg:flex-row lg:items-center justify-between p-4 border border-gray-200 rounded-2xl hover:shadow-md transition-all duration-200"
            >
              <div class="flex items-start space-x-4">
                <img
                  :src="webinar.thumbnail"
                  :alt="webinar.title"
                  class="w-20 h-12 object-cover rounded-xl"
                />
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <h3 class="font-semibold text-gray-900">{{ webinar.title }}</h3>
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border"
                      :class="getStatusColor(webinar.status)"
                    >
                      <component :is="getStatusIcon(webinar.status)" class="w-3 h-3 mr-1" />
                      {{ webinar.status === 'upcoming' ? 'Upcoming' : 'Ended' }}
                    </span>
                  </div>
                  <div class="flex items-center space-x-4 text-sm text-gray-600">
                    <span class="flex items-center space-x-1">
                      <Calendar class="w-4 h-4" />
                      <span>{{ formatDate(webinar.date) }}</span>
                    </span>
                    <span v-if="webinar.duration" class="flex items-center space-x-1">
                      <Clock class="w-4 h-4" />
                      <span>{{ webinar.duration }}</span>
                    </span>
                    <span class="flex items-center space-x-1">
                      <Users class="w-4 h-4" />
                      <span>{{ webinar.attendees }} attendees</span>
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2 mt-4 lg:mt-0">
                <template v-if="webinar.status === 'upcoming'">
                  <RouterLink
                    :to="`/studio/${webinar.id}`"
                    class="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors duration-200"
                  >
                    <Settings class="w-4 h-4" />
                    <span>Open Studio</span>
                  </RouterLink>
                </template>
                <template v-else>
                  <RouterLink
                    :to="`/replay/${webinar.id}`"
                    class="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors duration-200"
                  >
                    <Play class="w-4 h-4" />
                    <span>Replay</span>
                  </RouterLink>
                  <RouterLink
                    :to="`/editor/${webinar.id}`"
                    class="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors duration-200"
                  >
                    <Edit3 class="w-4 h-4" />
                    <span>Edit</span>
                  </RouterLink>
                  <button class="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors duration-200">
                    <Download class="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>