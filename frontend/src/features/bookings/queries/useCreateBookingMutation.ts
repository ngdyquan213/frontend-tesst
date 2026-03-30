import { useMutation } from '@tanstack/react-query'
import { bookingsApi } from '@/features/bookings/api/bookings.api'

export const useCreateBookingMutation = () =>
  useMutation({
    mutationFn: bookingsApi.createBooking,
  })

