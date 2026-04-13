import { mapApiBookingToBooking } from '@/shared/lib/appMappers'
import { apiClient } from '@/shared/api/apiClient'
import type { PaginatedResult } from '@/shared/types/pagination'

export const adminBookingsApi = {
  getBookings: async (
    page = 1,
    pageSize = 10,
  ): Promise<PaginatedResult<ReturnType<typeof mapApiBookingToBooking>>> => {
    const offset = (page - 1) * pageSize
    const response = await apiClient.getAllBookings(pageSize, offset)

    return {
      items: response.bookings.map(mapApiBookingToBooking),
      meta: {
        page,
        pageSize,
        total: response.total,
      },
    }
  },
}
