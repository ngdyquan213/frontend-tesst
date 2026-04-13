import { apiClient } from '@/shared/api/apiClient'
import type { NotificationItemResponse } from '@/shared/types/api'

function sortNewestFirst<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

function mapApiNotification(notification: NotificationItemResponse) {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    createdAt: notification.created_at,
    read: notification.read,
  }
}

export const notificationsApi = {
  getNotifications: async () => {
    const response = await apiClient.getNotifications()
    return sortNewestFirst(response.items.map(mapApiNotification))
  },
  markNotificationRead: async (id: string) => mapApiNotification(await apiClient.markNotificationRead(id)),
  markAllNotificationsRead: async () => {
    const response = await apiClient.markAllNotificationsRead()
    return sortNewestFirst(response.items.map(mapApiNotification))
  },
}
