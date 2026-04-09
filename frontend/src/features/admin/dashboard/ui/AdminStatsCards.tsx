import { useAdminDashboardQuery } from '@/features/admin/dashboard/queries/useAdminDashboardQuery'
import { Card } from '@/shared/ui/Card'

export const AdminStatsCards = () => {
  const { data } = useAdminDashboardQuery()
  if (!data) return null

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <div className="text-4xl font-extrabold text-primary">{data.activeBookings}</div>
        <div className="mt-2 text-sm text-on-surface-variant">Active bookings</div>
      </Card>
      <Card>
        <div className="text-4xl font-extrabold text-danger">{data.pendingRefunds}</div>
        <div className="mt-2 text-sm text-on-surface-variant">Pending refunds</div>
      </Card>
      <Card>
        <div className="text-4xl font-extrabold text-secondary">{data.recentActivityCount}</div>
        <div className="mt-2 text-sm text-on-surface-variant">Recent activities</div>
      </Card>
    </div>
  )
}
