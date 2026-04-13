import { mapApiRefundToRefundRecord } from '@/shared/lib/appMappers'
import { apiClient } from '@/shared/api/apiClient'

export const refundsApi = {
  getRefunds: async () => {
    const response = await apiClient.getUserRefunds()
    return response.refunds.map(mapApiRefundToRefundRecord)
  },
  getRefundDetail: async (id: string) => {
    const response = await apiClient.getRefund(id)
    return mapApiRefundToRefundRecord(response)
  },
  createRefundRequest: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
    const response = await apiClient.createRefundRequest({ booking_id: bookingId, reason })
    return mapApiRefundToRefundRecord(response)
  },
}
