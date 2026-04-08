import { useQuery } from '@tanstack/react-query'
import { refundsApi } from '@/features/refunds/api/refunds.api'
import { refundKeys } from '@/features/refunds/queries/refundKeys'

export const useRefundDetailQuery = (id?: string) =>
  useQuery({
    queryKey: refundKeys.detail(id ?? 'missing'),
    queryFn: async () => {
      if (!id) {
        throw new Error('Missing refund id.')
      }

      return refundsApi.getRefundDetail(id)
    },
    enabled: Boolean(id),
  })
