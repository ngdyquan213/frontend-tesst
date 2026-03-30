import { useQuery } from '@tanstack/react-query'
import { bookingsApi } from '@/features/bookings/api/bookings.api'
import { bookingKeys } from '@/features/bookings/queries/bookingKeys'

export const useBookingsQuery = () =>
  useQuery({
    queryKey: bookingKeys.list(),
    queryFn: bookingsApi.getBookings,
  })

