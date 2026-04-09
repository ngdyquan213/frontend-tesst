import { mapApiRefundToRefundRecord } from '@/shared/lib/appMappers'
import { apiClient } from '@/shared/api/apiClient'
import { resolveMockable } from '@/shared/api/mockApi'

export const refundsApi = {
  getRefunds: async () =>
    resolveMockable({
      mock: ({ refunds }) => refunds,
      live: async () => {
        const response = await apiClient.getUserRefunds()
        return response.refunds.map(mapApiRefundToRefundRecord)
      },
    }),
  getRefundDetail: async (id: string) =>
    resolveMockable({
      mock: ({ refunds }) => {
        const refund = refunds.find((item) => item.id === id)

        if (!refund) {
          throw new Error('Refund not found.')
        }

        return refund
      },
      live: async () => {
        const response = await apiClient.getRefund(id)
        return mapApiRefundToRefundRecord(response)
      },
    }),
  createRefundRequest: async ({ bookingId, reason }: { bookingId: string; reason: string }) =>
    resolveMockable({
      mock: ({ refunds }) => {
        refunds.unshift({
          id: `refund-${refunds.length + 1}`,
          bookingId,
          amount: 320,
          status: 'draft',
          reason,
          createdAt: new Date().toISOString(),
          timeline: [{ label: 'Request created', date: new Date().toISOString(), status: 'complete' }],
        })
        return refunds[0]
      },
      live: async () => {
        const response = await apiClient.createRefundRequest({ booking_id: bookingId, reason })
        return mapApiRefundToRefundRecord(response)
      },
    }),
}
