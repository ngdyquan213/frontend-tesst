import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supportApi } from '@/features/support/api/support.api'
import { adminSupportKeys } from '@/features/admin/operations/queries/adminSupportKeys'

export const useAdminUpdateSupportTicketStatusMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: 'open' | 'in_review' | 'waiting_for_traveler' | 'resolved'
    }) => supportApi.updateAdminSupportTicketStatus(id, { status }),
    onSuccess: (ticket, variables) => {
      queryClient.setQueryData(adminSupportKeys.detail(variables.id), ticket)
      queryClient.invalidateQueries({ queryKey: adminSupportKeys.list() })
    },
  })
}
