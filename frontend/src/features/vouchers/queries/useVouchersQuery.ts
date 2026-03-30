import { useQuery } from '@tanstack/react-query'
import { vouchersApi } from '@/features/vouchers/api/vouchers.api'
import { voucherKeys } from '@/features/vouchers/queries/voucherKeys'

export const useVouchersQuery = () =>
  useQuery({
    queryKey: voucherKeys.list(),
    queryFn: vouchersApi.getVouchers,
  })

