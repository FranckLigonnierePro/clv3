import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import Dashboard from '../views/Dashboard.vue'
import Studio from '../views/Studio.vue'
import VideoEditor from '../views/VideoEditor.vue'
import ReplayPage from '../views/ReplayPage.vue'
import Watch from '../views/Watch.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/studio/:id?',
      name: 'studio',
      component: Studio
    },
    {
      path: '/editor/:id',
      name: 'video-editor',
      component: VideoEditor
    },
    {
      path: '/replay/:id',
      name: 'replay',
      component: ReplayPage
    },
    {
      path: '/watch',
      name: 'watch',
      component: Watch,
      props: route => ({
        room: route.query.room,
        token: route.query.token
      })
    },
    // Legacy routes for backward compatibility
    {
      path: '/builder/:id?',
      redirect: to => `/studio/${to.params.id || 'new'}`
    },
    {
      path: '/live/:id',
      redirect: to => `/studio/${to.params.id}`
    }
  ]
})

export default router