<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Plus, Play, Edit3, Download, Calendar, Clock, Users, Video, Settings } from 'lucide-vue-next'
import { supabase } from '../supabase'

const router = useRouter()
const user = ref<any>(null)
const loading = ref(true)

const projects = ref<any[]>([])

// Récupérer les projets de l'utilisateur
const fetchProjects = async () => {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      router.push('/login')
      return
    }
    
    user.value = currentUser
    
    // Récupérer les projets de l'utilisateur
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    projects.value = data || []
  } catch (error) {
    console.error('Error fetching projects:', error)
  } finally {
    loading.value = false
  }
}

// Déconnexion
const handleSignOut = async () => {
  try {
    await supabase.auth.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Créer un nouveau projet
const createNewProject = async () => {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      router.push('/login')
      return
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert([
        { 
          user_id: currentUser.id, 
          title: `Nouveau projet ${new Date().toLocaleDateString()}` 
        },
      ])
      .select()
      .single()
    
    if (error) throw error
    
    // Rediriger vers l'éditeur avec le nouveau projet
    router.push(`/studio/${data.id}`)
  } catch (error) {
    console.error('Error creating project:', error)
  }
}

// Vérifier l'authentification au chargement
onMounted(() => {
  fetchProjects()
})

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
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- En-tête -->
<header class="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex-shrink-0 flex items-center">
        <h1 class="text-xl font-bold text-gray-900">ClipLive</h1>
      </div>
      <div class="flex items-center space-x-4">
        <button 
          @click="handleSignOut"
          class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Déconnexion
        </button>
        <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          <span class="text-sm font-medium text-gray-700">{{ user?.email?.charAt(0).toUpperCase() }}</span>
        </div>
      </div>
    </div>
  </div>
</header>
    
    <main class="pt-24 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Mes projets</h1>
            <p class="text-gray-600">Gérez vos projets et enregistrements</p>
          </div>
          <RouterLink 
            @click="createNewProject"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus class="w-5 h-5 mr-2" />
            <span>Nouveau projet</span>
          </RouterLink>
        </div>

        <!-- Chargement -->
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <!-- Message si pas de projets -->
        <div v-else-if="projects.length === 0" class="text-center py-12">
          <div class="mx-auto w-24 h-24 text-gray-300 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-1">Aucun projet</h3>
          <p class="text-gray-500 mb-6">Commencez par créer votre premier projet</p>
          <button
            @click="createNewProject"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus class="w-5 h-5 mr-2" />
            Nouveau projet
          </button>
        </div>

        <!-- Liste des projets -->
        <div v-if="projects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="project in projects" 
            :key="project.id"
            class="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-gray-100"
          >
            <div class="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <Video class="w-12 h-12 text-white opacity-90" />
            </div>
            <div class="p-5">
              <div class="flex justify-between items-start">
                <h3 class="text-lg font-semibold text-gray-900 truncate">{{ project.title }}</h3>
              </div>
              <div class="mt-2 text-sm text-gray-500">
                Créé le {{ formatDate(project.created_at) }}
              </div>
              <div class="mt-4 flex space-x-2">
                <RouterLink
                  :to="`/studio/${project.id}`"
                  class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit3 class="w-4 h-4 mr-2" />
                  Modifier
                </RouterLink>
                <button
                  class="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Play class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>