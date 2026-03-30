import { PageHeader } from '@/shared/components/PageHeader'
import { BookingHistorySection } from '@/widgets/account/BookingHistorySection'
import { DocumentOverviewSection } from '@/widgets/account/DocumentOverviewSection'
import { NotificationCenterSection } from '@/widgets/account/NotificationCenterSection'
import { ProfileOverviewSection } from '@/widgets/account/ProfileOverviewSection'

const DashboardPage = () => (
  <div className="space-y-10">
    <PageHeader title="Dashboard" description="Your account modules now share one connected data backbone." />
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <ProfileOverviewSection />
      <BookingHistorySection />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <DocumentOverviewSection />
      <NotificationCenterSection />
    </div>
  </div>
)

export default DashboardPage

