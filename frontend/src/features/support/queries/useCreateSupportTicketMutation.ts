import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supportApi } from '@/features/support/api/support.api'
import { supportKeys } from '@/features/support/queries/supportKeys'

export const useCreateSupportTicketMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: supportApi.createSupportTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportKeys.all }),
  })
}

