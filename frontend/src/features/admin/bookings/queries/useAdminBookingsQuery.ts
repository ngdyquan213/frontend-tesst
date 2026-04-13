import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { adminBookingsApi } from '@/features/admin/bookings/api/adminBookings.api'
import { adminBookingKeys } from '@/features/admin/bookings/queries/adminBookingKeys'

export const useAdminBookingsQuery = (page = 1, pageSize = 10) =>
  useQuery({
    queryKey: adminBookingKeys.list({ page, pageSize }),
    queryFn: () => adminBookingsApi.getBookings(page, pageSize),
    placeholderData: keepPreviousData,
  })
