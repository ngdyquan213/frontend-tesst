import { useMutation, useQueryClient } from '@tanstack/react-query'
import { travelersApi } from '@/features/travelers/api/travelers.api'
import { travelerKeys } from '@/features/travelers/queries/travelerKeys'

export const useUpdateTravelerMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: travelersApi.updateTraveler,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: travelerKeys.all }),
  })
}

