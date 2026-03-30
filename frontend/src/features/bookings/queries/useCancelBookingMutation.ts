import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsApi } from '@/features/bookings/api/bookings.api'
import { bookingKeys } from '@/features/bookings/queries/bookingKeys'

export const useCancelBookingMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bookingsApi.cancelBooking,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  })
}

