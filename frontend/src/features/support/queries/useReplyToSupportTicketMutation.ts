import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supportApi } from '@/features/support/api/support.api'
import { supportKeys } from '@/features/support/queries/supportKeys'

export const useReplyToSupportTicketMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      supportApi.replyToSupportTicket(id, { message }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.all })
      queryClient.invalidateQueries({ queryKey: supportKeys.detail(variables.id) })
    },
  })
}
