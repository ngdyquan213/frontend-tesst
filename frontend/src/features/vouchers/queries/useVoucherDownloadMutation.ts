import { useMutation } from '@tanstack/react-query'
import { vouchersApi } from '@/features/vouchers/api/vouchers.api'

export const useVoucherDownloadMutation = () =>
  useMutation({
    mutationFn: vouchersApi.downloadVoucher,
  })

