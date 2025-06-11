<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Play, Edit3, Users, Clock, Star, ArrowRight, Video, Mic, Share2 } from 'lucide-vue-next'
import Header from '../components/Header.vue'

const features = [
  {
    icon: Video,
    title: 'Host Live Webinars',
    description: 'Stream high-quality webinars with professional tools and real-time interaction capabilities.',
    color: 'bg-primary-50 text-primary-600'
  },
  {
    icon: Edit3,
    title: 'Edit on the Fly',
    description: 'Edit your recordings with intuitive tools, add markers during live sessions, and create polished content.',
    color: 'bg-secondary-50 text-secondary-600'
  },
  {
    icon: Share2,
    title: 'Share & Replay',
    description: 'Turn your live sessions into shareable content and build your audience with professional replays.',
    color: 'bg-accent-50 text-accent-600'
  }
]

const audiences = [
  {
    title: 'Content Creators',
    description: 'Build your audience with engaging live content and polished video replays.',
    icon: Star
  },
  {
    title: 'Educators & Coaches',
    description: 'Deliver impactful lessons and training sessions with interactive features.',
    icon: Users
  },
  {
    title: 'Business Teams',
    description: 'Host professional webinars, product demos, and team meetings.',
    icon: Mic
  }
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-white">
    <Header />
    
    <!-- Hero Section -->
    <section class="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center max-w-4xl mx-auto">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Create. Stream. Edit.
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              All in one place.
            </span>
          </h1>
          <p class="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            ClipLive is the all-in-one solution for hosting webinars, recording them, and turning your live sessions into shareable, polished video content.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <RouterLink to="/dashboard" class="btn-primary flex items-center space-x-2">
              <Video class="w-5 h-5" />
              <span>Create a Webinar</span>
            </RouterLink>
            <RouterLink to="/studio/demo" class="btn-secondary flex items-center space-x-2">
              <Play class="w-5 h-5" />
              <span>Try Studio</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to go live
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            From hosting to editing to sharing, ClipLive provides all the tools you need to create professional video content.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="card text-center group hover:scale-105 transition-transform duration-200"
          >
            <div class="inline-flex p-4 rounded-2xl mb-4" :class="feature.color">
              <component :is="feature.icon" class="w-8 h-8" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">{{ feature.title }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Audience Section -->
    <section class="py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Built for creators like you
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're educating, entertaining, or building your business, ClipLive adapts to your needs.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="audience in audiences"
            :key="audience.title"
            class="card group hover:shadow-lg transition-all duration-200"
          >
            <div class="flex items-center space-x-3 mb-4">
              <div class="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl">
                <component :is="audience.icon" class="w-6 h-6 text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900">{{ audience.title }}</h3>
            </div>
            <p class="text-gray-600 leading-relaxed">{{ audience.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-secondary-600">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to start creating?
        </h2>
        <p class="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Join thousands of creators who are already using ClipLive to build their audience and share their expertise.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <RouterLink to="/dashboard" class="bg-white text-primary-600 hover:bg-gray-50 font-medium px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2">
            <span>Start for Free</span>
            <ArrowRight class="w-5 h-5" />
          </RouterLink>
          <button class="text-white border border-white/30 hover:bg-white/10 font-medium px-8 py-4 rounded-2xl transition-all duration-200">
            Watch Demo
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div class="max-w-7xl mx-auto text-center">
        <div class="flex items-center justify-center space-x-2 mb-4">
          <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
            <Video class="w-5 h-5 text-white" />
          </div>
          <span class="text-xl font-bold text-white">ClipLive</span>
        </div>
        <p class="text-gray-400">© 2025 ClipLive. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>