import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminToursApi } from '@/features/admin/tours/api/adminTours.api'
import { adminTourKeys } from '@/features/admin/tours/queries/adminTourKeys'

export const useCreateTourMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminToursApi.createTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTourKeys.all })
    },
  })
}
