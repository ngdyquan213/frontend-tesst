import { useMutation } from '@tanstack/react-query'
import { adminBookingsApi } from '@/features/admin/bookings/api/adminBookings.api'

export const useUpdateBookingStatusMutation = () =>
  useMutation({
    mutationFn: adminBookingsApi.updateBookingStatus,
  })

