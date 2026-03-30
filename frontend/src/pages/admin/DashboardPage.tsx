import { PageHeader } from '@/shared/components/PageHeader'
import { BookingQueueSection } from '@/widgets/admin/BookingQueueSection'
import { DashboardStatsSection } from '@/widgets/admin/DashboardStatsSection'
import { OperationsBoardSection } from '@/widgets/admin/OperationsBoardSection'
import { RefundQueueSection } from '@/widgets/admin/RefundQueueSection'

const DashboardPage = () => (
  <div className="space-y-10">
    <PageHeader title="Admin Dashboard" description="Platform status and operational queue overview." />
    <DashboardStatsSection />
    <BookingQueueSection />
    <RefundQueueSection />
    <OperationsBoardSection />
  </div>
)

export default DashboardPage

