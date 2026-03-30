import { useQuery } from '@tanstack/react-query'
import { bookingsApi } from '@/features/bookings/api/bookings.api'
import { bookingKeys } from '@/features/bookings/queries/bookingKeys'

export const useBookingDetailQuery = (id: string) =>
  useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingsApi.getBookingDetail(id),
    enabled: Boolean(id),
  })

