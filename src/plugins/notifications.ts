import { createApp, type App, type Component, h, render } from 'vue'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-vue-next'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface NotificationOptions {
  type?: NotificationType
  duration?: number
  dismissible?: boolean
}

const NotificationComponent = {
  props: {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String as () => NotificationType,
      default: 'info'
    },
    onDismiss: {
      type: Function,
      required: true
    }
  },
  setup(props: any) {
    const typeIcons = {
      success: CheckCircle,
      error: XCircle,
      info: Info,
      warning: AlertTriangle
    }
    
    const typeColors = {
      success: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
      info: 'bg-blue-100 text-blue-700',
      warning: 'bg-yellow-100 text-yellow-700'
    }
    
    const Icon = typeIcons[props.type as NotificationType] || Info
    const colorClass = typeColors[props.type as NotificationType] || typeColors.info
    
    return () => (
      h('div', { 
        class: `rounded-lg p-4 mb-2 shadow-lg max-w-sm w-full transform transition-all duration-300 ${colorClass}`,
        style: 'min-width: 300px;'
      }, [
        h('div', { class: 'flex items-center' }, [
          h('div', { class: 'flex-shrink-0' }, [
            h(Icon, { class: 'w-6 h-6' })
          ]),
          h('div', { class: 'ml-3 w-0 flex-1 pt-0.5' }, [
            h('p', { class: 'text-sm font-medium' }, props.message)
          ]),
          h('div', { class: 'ml-4 flex-shrink-0 flex' }, [
            h('button', {
              class: 'inline-flex text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md',
              onClick: () => props.onDismiss()
            }, [
              h('span', { class: 'sr-only' }, 'Fermer'),
              h(X, { class: 'h-5 w-5' })
            ])
          ])
        ])
      ])
    )
  }
}

export const notify = (message: string, options: NotificationOptions = {}) => {
  const container = document.createElement('div')
  const notificationsContainer = document.getElementById('notifications') || document.body
  
  // Créer une fonction pour supprimer la notification
  const dismiss = () => {
    container.classList.add('opacity-0', 'translate-y-2')
    setTimeout(() => {
      notificationsContainer.removeChild(container)
    }, 300)
  }
  
  // Créer l'instance de notification
  const notification = h(NotificationComponent, {
    message,
    type: options.type || 'info',
    onDismiss: dismiss
  })
  
  // Rendre la notification dans le conteneur
  render(notification, container)
  
  // Ajouter la notification au conteneur
  notificationsContainer.appendChild(container)
  
  // Forcer un reflow pour activer la transition
  container.offsetHeight
  container.classList.add('opacity-100')
  
  // Configurer la suppression automatique
  const duration = options.duration !== undefined ? options.duration : 5000
  let timeoutId: number | null = null
  
  if (duration > 0) {
    timeoutId = window.setTimeout(dismiss, duration)
  }
  
  // Retourner une fonction pour supprimer manuellement la notification
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    dismiss()
  }
}

// Méthodes utilitaires pour chaque type de notification
const createNotificationMethod = (type: NotificationType) => {
  return (message: string, options: Omit<NotificationOptions, 'type'> = {}) => {
    return notify(message, { ...options, type })
  }
}

export const notification = {
  success: createNotificationMethod('success'),
  error: createNotificationMethod('error'),
  info: createNotificationMethod('info'),
  warning: createNotificationMethod('warning'),
  default: notify
}

// Plugin Vue
export default {
  install: (app: App) => {
    app.config.globalProperties.$notify = notification
  }
}
