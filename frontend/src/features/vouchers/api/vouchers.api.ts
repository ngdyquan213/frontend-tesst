import { resolveAfter } from '@/shared/api/apiClient'
import { vouchers } from '@/shared/api/mockData'

export const vouchersApi = {
  getVouchers: () => resolveAfter(vouchers),
  downloadVoucher: (id: string) => resolveAfter(vouchers.find((voucher) => voucher.id === id)),
}

