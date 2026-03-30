import { resolveAfter } from '@/shared/api/apiClient'
import { notifications } from '@/shared/api/mockData'

export const notificationsApi = {
  getNotifications: () => resolveAfter(notifications),
  markNotificationRead: async (id: string) => {
    const notification = notifications.find((item) => item.id === id)
    if (notification) notification.read = true
    return resolveAfter(notification)
  },
  markAllNotificationsRead: async () => {
    notifications.forEach((notification) => {
      notification.read = true
    })
    return resolveAfter(notifications)
  },
}

