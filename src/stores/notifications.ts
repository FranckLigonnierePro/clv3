import { defineStore } from 'pinia'
import { ref } from 'vue'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timeout?: number
}

export const useNotifications = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const defaultTimeout = 5000 // 5 secondes

  const addNotification = ({
    type = 'info',
    title,
    message,
    timeout = defaultTimeout
  }: {
    type?: NotificationType
    title: string
    message: string
    timeout?: number
  }) => {
    const id = Math.random().toString(36).substring(2, 11)
    const notification: Notification = {
      id,
      type,
      title,
      message,
      timeout
    }

    notifications.value.push(notification)

    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, timeout)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    notifications.value = []
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  }
})
