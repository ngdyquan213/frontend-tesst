import { resolveAfter } from '@/shared/api/apiClient'
import { bookings } from '@/shared/api/mockData'

export const adminBookingsApi = {
  getBookings: () => resolveAfter(bookings),
  updateBookingStatus: async () => resolveAfter(bookings[0]),
}

