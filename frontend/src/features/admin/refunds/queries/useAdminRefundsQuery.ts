import { useQuery } from '@tanstack/react-query'
import { adminRefundsApi } from '@/features/admin/refunds/api/adminRefunds.api'
import { adminRefundKeys } from '@/features/admin/refunds/queries/adminRefundKeys'

export const useAdminRefundsQuery = () =>
  useQuery({
    queryKey: adminRefundKeys.list(),
    queryFn: adminRefundsApi.getRefunds,
  })

