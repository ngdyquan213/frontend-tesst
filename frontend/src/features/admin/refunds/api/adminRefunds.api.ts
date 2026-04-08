import { env } from '@/app/config/env'
import { mapApiRefundToRefundRecord } from '@/shared/lib/appMappers'
import { resolveAfter } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { refunds } from '@/shared/api/mockData'

export const adminRefundsApi = {
  getRefunds: async () => {
    if (env.enableMocks) {
      return resolveAfter(refunds)
    }

    const response = await apiClient.getAdminRefunds()
    return response.refunds.map(mapApiRefundToRefundRecord)
  },
  approveRefund: async (id?: string) => {
    if (env.enableMocks || !id) {
      return resolveAfter(refunds[0])
    }

    const response = await apiClient.approveRefund(id)
    return mapApiRefundToRefundRecord(response)
  },
}
