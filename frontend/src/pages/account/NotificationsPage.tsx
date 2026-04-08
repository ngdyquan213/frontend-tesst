import { useState } from 'react'
import { NotificationFilterTabs } from '@/features/notifications/ui/NotificationFilterTabs'
import { NotificationList } from '@/features/notifications/ui/NotificationList'
import { PageHeader } from '@/shared/components/PageHeader'
import { useNotificationsQuery } from '@/features/notifications/queries/useNotificationsQuery'

const NotificationsPage = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const notificationsQuery = useNotificationsQuery()
  const filteredNotifications = (notificationsQuery.data ?? []).filter((notification) =>
    filter === 'unread' ? !notification.read : true,
  )

  return (
    <div className="space-y-10">
      <PageHeader
        title="Notifications"
        description={
          filter === 'unread'
            ? `${filteredNotifications.length} unread updates need your attention.`
            : 'Booking updates, document reviews, and support replies appear here.'
        }
      />
      <NotificationFilterTabs onChange={setFilter} value={filter} />
      <NotificationList
        notifications={filteredNotifications}
        isPending={notificationsQuery.isPending}
      />
    </div>
  )
}

export default NotificationsPage
