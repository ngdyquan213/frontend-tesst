import { mapApiRefundToRefundRecord } from '@/shared/lib/appMappers'
import { apiClient } from '@/shared/api/apiClient'
import { resolveMockData, resolveMockable } from '@/shared/api/mockApi'

export const adminRefundsApi = {
  getRefunds: async () =>
    resolveMockable({
      mock: ({ refunds }) => refunds,
      live: async () => {
        const response = await apiClient.getAdminRefunds()
        return response.refunds.map(mapApiRefundToRefundRecord)
      },
    }),
  approveRefund: async (id?: string) => {
    if (!id) {
      return resolveMockData(({ refunds }) => refunds[0])
    }

    return resolveMockable({
      mock: ({ refunds }) => refunds[0],
      live: async () => {
        const response = await apiClient.approveRefund(id)
        return mapApiRefundToRefundRecord(response)
      },
    })
  },
}
