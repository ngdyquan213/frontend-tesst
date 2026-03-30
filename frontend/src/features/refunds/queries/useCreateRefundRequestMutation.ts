import { useMutation, useQueryClient } from '@tanstack/react-query'
import { refundsApi } from '@/features/refunds/api/refunds.api'
import { refundKeys } from '@/features/refunds/queries/refundKeys'

export const useCreateRefundRequestMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: refundsApi.createRefundRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: refundKeys.all }),
  })
}

