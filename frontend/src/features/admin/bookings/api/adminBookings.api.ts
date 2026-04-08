import { env } from '@/app/config/env'
import { mapApiBookingToBooking } from '@/shared/lib/appMappers'
import { resolveAfter } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { bookings } from '@/shared/api/mockData'

export const adminBookingsApi = {
  getBookings: async () => {
    if (env.enableMocks) {
      return resolveAfter(bookings)
    }

    const response = await apiClient.getAllBookings()
    return response.bookings.map(mapApiBookingToBooking)
  },
  updateBookingStatus: async () => resolveAfter(bookings[0]),
}
