import { apiClient } from '@/shared/api/apiClient'
import { resolveMockable } from '@/shared/api/mockApi'
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
  getNotifications: async () =>
    resolveMockable({
      mock: ({ notifications }) => notifications,
      live: async () => {
        const response = await apiClient.getNotifications()
        return sortNewestFirst(response.items.map(mapApiNotification))
      },
    }),
  markNotificationRead: async (id: string) =>
    resolveMockable({
      mock: ({ notifications }) => {
        const notification = notifications.find((item) => item.id === id)
        if (notification) {
          notification.read = true
        }
        return notification
      },
      live: async () => mapApiNotification(await apiClient.markNotificationRead(id)),
    }),
  markAllNotificationsRead: async () =>
    resolveMockable({
      mock: ({ notifications }) => {
        notifications.forEach((notification) => {
          notification.read = true
        })
        return notifications
      },
      live: async () => {
        const response = await apiClient.markAllNotificationsRead()
        return sortNewestFirst(response.items.map(mapApiNotification))
      },
    }),
}
