import { useNotificationsQuery } from '@/features/notifications/queries/useNotificationsQuery'
import { Card } from '@/shared/ui/Card'

export const NotificationList = () => {
  const { data } = useNotificationsQuery()
  return (
    <div className="grid gap-4">
      {data?.map((notification) => (
        <Card key={notification.id}>
          <h3 className="font-bold text-primary">{notification.title}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{notification.body}</p>
        </Card>
      ))}
    </div>
  )
}

