import { useQuery } from '@tanstack/react-query'
import { adminBookingsApi } from '@/features/admin/bookings/api/adminBookings.api'
import { adminBookingKeys } from '@/features/admin/bookings/queries/adminBookingKeys'

export const useAdminBookingsQuery = () =>
  useQuery({
    queryKey: adminBookingKeys.list(),
    queryFn: adminBookingsApi.getBookings,
  })

