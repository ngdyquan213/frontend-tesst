import { env } from '@/app/config/env'
import { resolveAfter } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { adminTasks, bookings, documents, refunds } from '@/shared/api/mockData'

export const adminDashboardApi = {
  getDashboard: async () => {
    if (env.enableMocks) {
      return resolveAfter({
        activeBookings: bookings.length,
        pendingRefunds: refunds.length,
        documentQueue: documents.length,
        tasks: adminTasks,
      })
    }

    const stats = await apiClient.getAdminStats()

    return {
      activeBookings: stats.total_bookings,
      pendingRefunds: stats.pending_approvals,
      documentQueue: stats.document_queue ?? 0,
      tasks: [],
    }
  },
}
