import { resolveAfter } from '@/shared/api/apiClient'
import { refunds } from '@/shared/api/mockData'

export const adminRefundsApi = {
  getRefunds: () => resolveAfter(refunds),
  approveRefund: async () => resolveAfter(refunds[0]),
}

