import { resolveAfter } from '@/shared/api/apiClient'
import { bookings } from '@/shared/api/mockData'

export const bookingsApi = {
  getBookings: () => resolveAfter(bookings),
  getBookingDetail: (id: string) => resolveAfter(bookings.find((booking) => booking.id === id) ?? bookings[0]),
  createBooking: async () => resolveAfter(bookings[0]),
  cancelBooking: async (id: string) => {
    const booking = bookings.find((item) => item.id === id)
    if (booking) booking.status = 'cancelled'
    return resolveAfter(booking)
  },
}

