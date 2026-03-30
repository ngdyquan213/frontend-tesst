import { useMutation } from '@tanstack/react-query'
import { adminToursApi } from '@/features/admin/tours/api/adminTours.api'

export const useCreateTourMutation = () =>
  useMutation({
    mutationFn: adminToursApi.createTour,
  })

