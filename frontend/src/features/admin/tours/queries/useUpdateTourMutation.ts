import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminToursApi } from '@/features/admin/tours/api/adminTours.api'
import { adminTourKeys } from '@/features/admin/tours/queries/adminTourKeys'

export const useUpdateTourMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminToursApi.updateTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTourKeys.all })
    },
  })
}
