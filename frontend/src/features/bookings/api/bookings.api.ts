import { mapApiBookingToBooking } from '@/shared/lib/appMappers'
import { apiClient } from '@/shared/api/apiClient'
import type { CreateBookingRequest } from '@/shared/types/api'

export const bookingsApi = {
  getBookings: async () => {
    const response = await apiClient.getUserBookings()
    return response.bookings.map(mapApiBookingToBooking)
  },
  getBookingDetail: async (id: string) => {
    const response = await apiClient.getBooking(id)
    return mapApiBookingToBooking(response.booking)
  },
  createBooking: async (payload: CreateBookingRequest) => {
    const response = await apiClient.createBooking(payload)
    return mapApiBookingToBooking(response.booking)
  },
  cancelBooking: async (id: string) => {
    await apiClient.cancelBooking(id)
    const response = await apiClient.getBooking(id)
    return mapApiBookingToBooking(response.booking)
  },
}
