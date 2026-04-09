import { apiClient } from '@/shared/api/apiClient'
import { resolveMockable } from '@/shared/api/mockApi'

const inactiveBookingStatuses = new Set(['cancelled', 'expired', 'failed'])

function countActiveBookings(bookingStatusCounts: Array<{ status: string; count: number }>) {
  return bookingStatusCounts.reduce(
    (sum, item) =>
      inactiveBookingStatuses.has(item.status.toLowerCase()) ? sum : sum + item.count,
    0,
  )
}

function countPendingRefunds(refundStatusCounts: Array<{ status: string; count: number }>) {
  return refundStatusCounts.reduce(
    (sum, item) => (item.status.toLowerCase() === 'pending' ? sum + item.count : sum),
    0,
  )
}

export const adminDashboardApi = {
  getDashboard: async () =>
    resolveMockable({
      mock: ({ adminTasks, bookings, refunds }) => ({
        activeBookings: bookings.length,
        pendingRefunds: refunds.length,
        recentActivityCount: adminTasks.length,
        tasks: adminTasks,
      }),
      live: async () => {
        const summary = await apiClient.getAdminDashboardSummary()

        return {
          activeBookings: countActiveBookings(summary.booking_status_counts),
          pendingRefunds: countPendingRefunds(summary.refund_status_counts),
          recentActivityCount: summary.recent_activities.length,
          tasks: [],
        }
      },
    }),
}
