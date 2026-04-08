import { env } from '@/app/config/env'
import { mapApiRefundToRefundRecord } from '@/shared/lib/appMappers'
import { resolveAfter } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { refunds } from '@/shared/api/mockData'

export const refundsApi = {
  getRefunds: async () => {
    if (env.enableMocks) {
      return resolveAfter(refunds)
    }

    const response = await apiClient.getUserRefunds()
    return response.refunds.map(mapApiRefundToRefundRecord)
  },
  getRefundDetail: async (id: string) => {
    if (env.enableMocks) {
      const refund = refunds.find((item) => item.id === id)

      if (!refund) {
        throw new Error('Refund not found.')
      }

      return resolveAfter(refund)
    }

    const response = await apiClient.getRefund(id)
    return mapApiRefundToRefundRecord(response)
  },
  createRefundRequest: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
    if (env.enableMocks) {
      refunds.unshift({
        id: `refund-${refunds.length + 1}`,
        bookingId,
        amount: 320,
        status: 'draft',
        reason,
        createdAt: new Date().toISOString(),
        timeline: [{ label: 'Request created', date: new Date().toISOString(), status: 'complete' }],
      })
      return resolveAfter(refunds[0])
    }

    const response = await apiClient.createRefundRequest({ booking_id: bookingId, reason })
    return mapApiRefundToRefundRecord(response)
  },
}
