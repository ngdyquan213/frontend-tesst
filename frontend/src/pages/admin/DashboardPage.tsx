import { useAuth } from '@/app/providers/AuthProvider'
import { ADMIN_PERMISSIONS } from '@/shared/constants/permissions'
import { hasPermission } from '@/shared/lib/auth'
import { PageHeader } from '@/shared/components/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { BookingQueueSection } from '@/widgets/admin/BookingQueueSection'
import { DashboardStatsSection } from '@/widgets/admin/DashboardStatsSection'
import { OperationsBoardSection } from '@/widgets/admin/OperationsBoardSection'
import { RefundQueueSection } from '@/widgets/admin/RefundQueueSection'

const DashboardPage = () => {
  const { user } = useAuth()
  const canViewDashboardStats = hasPermission(user, ADMIN_PERMISSIONS.dashboardRead)
  const canViewBookings = hasPermission(user, ADMIN_PERMISSIONS.bookingsRead)
  const canViewRefunds = hasPermission(user, ADMIN_PERMISSIONS.refundsRead)
  const canViewSupport = hasPermission(user, ADMIN_PERMISSIONS.supportRead)
  const canManageSupport = hasPermission(user, ADMIN_PERMISSIONS.supportWrite)
  const hasVisibleSections =
    canViewDashboardStats || canViewBookings || canViewRefunds || canViewSupport

  return (
    <div className="space-y-10">
      <PageHeader title="Admin Dashboard" description="Platform status and operational queue overview." />
      {!hasVisibleSections ? (
        <EmptyState
          title="No dashboard widgets are available"
          description="This account can enter the admin shell, but it does not currently have dashboard section permissions."
        />
      ) : null}
      {canViewDashboardStats ? <DashboardStatsSection /> : null}
      {canViewBookings ? <BookingQueueSection /> : null}
      {canViewRefunds ? <RefundQueueSection /> : null}
      {canViewSupport ? <OperationsBoardSection canManageTickets={canManageSupport} /> : null}
    </div>
  )
}

export default DashboardPage
