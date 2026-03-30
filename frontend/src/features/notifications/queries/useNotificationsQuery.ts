import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/features/notifications/api/notifications.api'
import { notificationKeys } from '@/features/notifications/queries/notificationKeys'

export const useNotificationsQuery = () =>
  useQuery({
    queryKey: notificationKeys.list(),
    queryFn: notificationsApi.getNotifications,
  })

