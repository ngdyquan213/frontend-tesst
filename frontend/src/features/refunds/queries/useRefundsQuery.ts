import { useQuery } from '@tanstack/react-query'
import { refundsApi } from '@/features/refunds/api/refunds.api'
import { refundKeys } from '@/features/refunds/queries/refundKeys'

export const useRefundsQuery = () =>
  useQuery({
    queryKey: refundKeys.list(),
    queryFn: refundsApi.getRefunds,
  })

