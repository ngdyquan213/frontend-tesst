import { useMutation } from '@tanstack/react-query'
import { adminRefundsApi } from '@/features/admin/refunds/api/adminRefunds.api'

export const useApproveRefundMutation = () =>
  useMutation({
    mutationFn: adminRefundsApi.approveRefund,
  })

