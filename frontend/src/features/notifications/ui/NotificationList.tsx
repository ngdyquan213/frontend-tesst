import { useNotificationsQuery } from '@/features/notifications/queries/useNotificationsQuery'
import type { NotificationRecord } from '@/shared/types/common'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

interface NotificationListProps {
  notifications?: NotificationRecord[]
  isPending?: boolean
}

export const NotificationList = ({
  notifications: notificationsProp,
  isPending: isPendingProp,
}: NotificationListProps) => {
  const { data, isPending } = useNotificationsQuery()
  const notifications = notificationsProp ?? data ?? []
  const showLoading = isPendingProp ?? (notificationsProp ? false : isPending)

  if (showLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </Card>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="No notifications"
        description="Status updates, booking alerts, and review messages will show up here as they happen."
      />
    )
  }

  return (
    <div className="grid gap-4">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={!notification.read ? 'border-primary/20 bg-primary/5' : undefined}
        >
          <h3 className="font-bold text-primary">{notification.title}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{notification.body}</p>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
            <span>{notification.type}</span>
            <span>{notification.read ? 'Read' : 'Unread'}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
