import { useMutation } from '@tanstack/react-query'
import { adminToursApi } from '@/features/admin/tours/api/adminTours.api'

export const useUpdateTourMutation = () =>
  useMutation({
    mutationFn: adminToursApi.updateTour,
  })

