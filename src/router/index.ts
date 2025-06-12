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
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    
    if (!user) {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
      next({ 
        name: 'login', 
        query: { 
          redirect: to.fullPath !== '/app/dashboard' ? to.fullPath : undefined 
        } 
      })
    } else {
      next()
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error)
    next({ name: 'login' })
  }
}

// Garde de navigation pour les routes d'authentification (empêche l'accès si déjà connecté)
const redirectIfAuthenticated = async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    
    if (user) {
      // Rediriger vers le tableau de bord si l'utilisateur est déjà connecté
      next({ 
        name: 'dashboard',
        replace: true // Empêche de revenir à la page de connexion avec le bouton retour
      })
    } else {
      next()
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error)
    next() // Continuer quand même pour ne pas bloquer l'utilisateur
  }
}

// Configuration des routes
const routes: RouteRecordRaw[] = [
  // Route d'accueil publique
  {
    path: '/',
    name: 'home',
    component: LandingPage,
    meta: { title: 'Accueil' },
    beforeEnter: (to, from, next) => {
      // Vérifier si l'utilisateur est connecté
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          next({ name: 'dashboard' })
        } else {
          next()
        }
      })
    }
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
    path: '/app',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      // Rediriger /app vers /app/dashboard
      {
        path: '',
        redirect: { name: 'dashboard' }
      },
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
        path: 'live/:id',
        redirect: to => `/app/studio/${to.params.id}`
      },
      // Redirection pour les anciennes URL
      {
        path: '/studio/:id?',
        redirect: to => ({
          name: 'studio',
          params: { id: to.params.id || 'new' }
        })
      },
      {
        path: '/dashboard',
        redirect: { name: 'dashboard' }
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
  try {
    // Définir le titre de la page
    const title = to.meta.title as string || 'ClipLive'
    document.title = title === 'ClipLive' ? title : `${title} | ClipLive`
    
    // Vérifier si la route est publique ou nécessite une authentification
    const isPublic = to.meta.public === true
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const isAuthRoute = to.matched.some(record => record.path.startsWith('/auth'))
    
    // Récupérer l'utilisateur actuel de manière sécurisée
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      // En cas d'erreur, on considère que l'utilisateur n'est pas authentifié
      if (requiresAuth) {
        return next({
          name: 'login',
          query: { 
            redirect: to.fullPath !== '/app/dashboard' ? to.fullPath : undefined,
            error: 'auth_error'
          }
        })
      }
      return next()
    }
    
    // Si l'utilisateur est sur une route protégée et n'est pas connecté
    if (requiresAuth && !user) {
      return next({
        name: 'login',
        query: { 
          redirect: to.fullPath !== '/app/dashboard' ? to.fullPath : undefined,
          reason: 'auth_required'
        },
        replace: true
      })
    }
    
    // Si l'utilisateur est connecté et essaie d'accéder à une route d'authentification
    if (isAuthRoute && user) {
      return next({ 
        name: 'dashboard',
        replace: true
      })
    }
    
    // Rediriger la racine vers le tableau de bord si l'utilisateur est connecté
    if (to.path === '/' && user) {
      return next({ 
        name: 'dashboard',
        replace: true
      })
    }
    
    next()
  } catch (error) {
    console.error('Erreur dans le garde de navigation globale:', error)
    // En cas d'erreur inattendue, rediriger vers la page d'accueil
    if (to.path !== '/') {
      next('/')
    } else {
      next()
    }
  }
})

// Gestion des erreurs de navigation
router.onError(error => {
  console.error('Erreur de navigation:', error)
  // Vous pourriez rediriger vers une page d'erreur ici
})

export default router