import { env } from '@/app/config/env'
import { mapApiBookingToBooking } from '@/shared/lib/appMappers'
import { resolveAfter } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { bookings } from '@/shared/api/mockData'
import type { CreateBookingRequest } from '@/shared/types/api'

export const bookingsApi = {
  getBookings: async () => {
    if (env.enableMocks) {
      return resolveAfter(bookings)
    }

    const response = await apiClient.getUserBookings()
    return response.bookings.map(mapApiBookingToBooking)
  },
  getBookingDetail: async (id: string) => {
    if (env.enableMocks) {
      const booking = bookings.find((item) => item.id === id)

      if (!booking) {
        throw new Error('Booking not found.')
      }

      return resolveAfter(booking)
    }

    const response = await apiClient.getBooking(id)
    return mapApiBookingToBooking(response.booking)
  },
  createBooking: async (payload: CreateBookingRequest) => {
    if (env.enableMocks) {
      return resolveAfter(bookings[0])
    }

    const response = await apiClient.createBooking(payload)
    return mapApiBookingToBooking(response.booking)
  },
  cancelBooking: async (id: string) => {
    if (env.enableMocks) {
      const booking = bookings.find((item) => item.id === id)
      if (booking) booking.status = 'cancelled'
      return resolveAfter(booking)
    }

    await apiClient.cancelBooking(id)
    const response = await apiClient.getBooking(id)
    return mapApiBookingToBooking(response.booking)
  },
}
