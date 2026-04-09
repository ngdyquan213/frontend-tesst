import { mapApiBookingToBooking } from '@/shared/lib/appMappers'
import { apiClient } from '@/shared/api/apiClient'
import { resolveMockable } from '@/shared/api/mockApi'

export const adminBookingsApi = {
  getBookings: async () =>
    resolveMockable({
      mock: ({ bookings }) => bookings,
      live: async () => {
        const response = await apiClient.getAllBookings()
        return response.bookings.map(mapApiBookingToBooking)
      },
    }),
}
