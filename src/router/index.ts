import { createRouter, createWebHistory, type RouteLocationNormalized, type NavigationGuardNext, type RouteRecordRaw } from 'vue-router'
import { supabase } from '@/supabase'

// Layouts
import MainLayout from '@/layouts/MainLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

// Vues publiques
import LandingPage from '@/views/LandingPage.vue'

// Vues d'authentification
import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import ForgotPassword from '@/views/auth/ForgotPassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'

// Vues protégées
import Dashboard from '@/views/Dashboard.vue'
import Studio from '@/views/Studio.vue'
import VideoEditor from '@/views/VideoEditor.vue'
import ReplayPage from '@/views/ReplayPage.vue'
import Watch from '@/views/Watch.vue'
import Profile from '@/views/user/Profile.vue'
import Settings from '@/views/user/Settings.vue'

// Vues d'erreur
import NotFound from '@/views/errors/NotFound.vue'
import Unauthorized from '@/views/errors/Unauthorized.vue'

// Garde de navigation pour les routes protégées
const requireAuth = async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
}

// Garde de navigation pour les routes d'authentification (empêche l'accès si déjà connecté)
const redirectIfAuthenticated = async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
}

// Configuration des routes
const routes: RouteRecordRaw[] = [
  // Route d'accueil publique
  {
    path: '/',
    component: LandingPage,
    name: 'landing',
    meta: { public: true, layout: 'empty' },
    beforeEnter: redirectIfAuthenticated
  },
  
  // Routes d'authentification
  {
    path: '/auth',
    component: AuthLayout,
    meta: { public: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: Login,
        meta: { title: 'Connexion' },
        beforeEnter: redirectIfAuthenticated
      },
      {
        path: 'register',
        name: 'register',
        component: Register,
        meta: { title: 'Inscription' },
        beforeEnter: redirectIfAuthenticated
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: ForgotPassword,
        meta: { title: 'Mot de passe oublié' },
        beforeEnter: redirectIfAuthenticated
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: ResetPassword,
        meta: { title: 'Réinitialiser le mot de passe' },
        beforeEnter: redirectIfAuthenticated,
        props: route => ({
          accessToken: route.query.access_token as string || ''
        })
      },
      {
        path: 'verify',
        name: 'verify-email',
        component: () => import('@/views/auth/VerifyEmail.vue'),
        meta: { title: 'Vérification d\'email' },
        beforeEnter: redirectIfAuthenticated,
        props: route => ({
          type: route.query.type as string || 'signup',
          token: route.query.token as string || ''
        })
      }
    ]
  },
  
  // Routes protégées avec layout principal
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: Dashboard,
        meta: { title: 'Tableau de bord' }
      },
      {
        path: 'studio/:id?',
        name: 'studio',
        component: Studio,
        meta: { title: 'Studio de création' },
        props: route => ({
          id: route.params.id === 'new' ? undefined : route.params.id
        })
      },
      {
        path: 'editor/:id',
        name: 'video-editor',
        component: VideoEditor,
        meta: { title: 'Éditeur vidéo' }
      },
      {
        path: 'replay/:id',
        name: 'replay',
        component: ReplayPage,
        meta: { title: 'Replay' }
      },
      {
        path: 'watch',
        name: 'watch',
        component: Watch,
        meta: { title: 'Visionnage', layout: 'empty' },
        props: route => ({
          room: route.query.room as string || '',
          token: route.query.token as string || ''
        })
      },
      {
        path: 'profile',
        name: 'profile',
        component: Profile,
        meta: { title: 'Mon profil' }
      },
      {
        path: 'settings',
        name: 'settings',
        component: Settings,
        meta: { title: 'Paramètres' }
      },
      // Redirections et compatibilité
      {
        path: 'builder/:id?',
        redirect: to => ({
          name: 'studio',
          params: { id: to.params.id || 'new' }
        })
      },
      {
        path: '/live/:id',
        redirect: to => `/studio/${to.params.id}`
      }
    ]
  },
  // Routes d'erreur
  {
    path: '/404',
    name: 'not-found',
    component: NotFound,
    meta: { public: true, title: 'Page non trouvée' }
  },
  {
    path: '/403',
    name: 'unauthorized',
    component: Unauthorized,
    meta: { public: true, title: 'Accès non autorisé' }
  },
  
  // Redirection 404 - Doit être la dernière route
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

// Création du routeur
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Faire défiler vers le haut lors du changement de route
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// Navigation guard globale
router.beforeEach(async (to, from, next) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  // Définir le titre de la page
  const title = to.meta.title as string || 'ClipLive'
  document.title = title === 'ClipLive' ? title : `${title} | ClipLive`
  
  // Vérifier l'authentification
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!user) {
      // Rediriger vers la page de connexion avec une redirection de retour
      return next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    }
  }
  
  // Empêcher l'accès aux pages d'authentification si déjà connecté
  if (to.matched.some(record => record.meta.public) && user) {
    return next({ name: 'dashboard' })
  }
  
  next()
})

// Gestion des erreurs de navigation
router.onError(error => {
  console.error('Erreur de navigation:', error)
  // Vous pourriez rediriger vers une page d'erreur ici
})

export default router