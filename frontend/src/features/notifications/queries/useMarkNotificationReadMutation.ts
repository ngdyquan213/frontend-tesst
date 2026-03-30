import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/features/notifications/api/notifications.api'
import { notificationKeys } from '@/features/notifications/queries/notificationKeys'

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

