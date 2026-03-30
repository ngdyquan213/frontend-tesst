import { NotificationList } from '@/features/notifications/ui/NotificationList'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const NotificationCenterSection = () => (
  <section>
    <SectionHeader title="Notifications" />
    <NotificationList />
  </section>
)

