import { mapApiBookingToBooking } from '@/shared/lib/appMappers'
import { apiClient } from '@/shared/api/apiClient'
import { resolveMockable } from '@/shared/api/mockApi'
import type { CreateBookingRequest } from '@/shared/types/api'

export const bookingsApi = {
  getBookings: async () =>
    resolveMockable({
      mock: ({ bookings }) => bookings,
      live: async () => {
        const response = await apiClient.getUserBookings()
        return response.bookings.map(mapApiBookingToBooking)
      },
    }),
  getBookingDetail: async (id: string) =>
    resolveMockable({
      mock: ({ bookings }) => {
        const booking = bookings.find((item) => item.id === id)

        if (!booking) {
          throw new Error('Booking not found.')
        }

        return booking
      },
      live: async () => {
        const response = await apiClient.getBooking(id)
        return mapApiBookingToBooking(response.booking)
      },
    }),
  createBooking: async (payload: CreateBookingRequest) =>
    resolveMockable({
      mock: ({ bookings }) => bookings[0],
      live: async () => {
        const response = await apiClient.createBooking(payload)
        return mapApiBookingToBooking(response.booking)
      },
    }),
  cancelBooking: async (id: string) =>
    resolveMockable({
      mock: ({ bookings }) => {
        const booking = bookings.find((item) => item.id === id)
        if (booking) {
          booking.status = 'cancelled'
        }
        return booking
      },
      live: async () => {
        await apiClient.cancelBooking(id)
        const response = await apiClient.getBooking(id)
        return mapApiBookingToBooking(response.booking)
      },
    }),
}
