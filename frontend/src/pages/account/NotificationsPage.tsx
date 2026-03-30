import { useState } from 'react'
import { NotificationFilterTabs } from '@/features/notifications/ui/NotificationFilterTabs'
import { NotificationList } from '@/features/notifications/ui/NotificationList'
import { PageHeader } from '@/shared/components/PageHeader'

const NotificationsPage = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  return (
    <div className="space-y-10">
      <PageHeader title="Notifications" />
      <NotificationFilterTabs onChange={setFilter} value={filter} />
      <NotificationList />
    </div>
  )
}

export default NotificationsPage

