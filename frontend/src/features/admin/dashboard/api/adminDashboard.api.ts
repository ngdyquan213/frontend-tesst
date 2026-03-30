import { resolveAfter } from '@/shared/api/apiClient'
import { adminTasks, bookings, documents, refunds } from '@/shared/api/mockData'

export const adminDashboardApi = {
  getDashboard: () =>
    resolveAfter({
      activeBookings: bookings.length,
      pendingRefunds: refunds.length,
      documentQueue: documents.length,
      tasks: adminTasks,
    }),
}

