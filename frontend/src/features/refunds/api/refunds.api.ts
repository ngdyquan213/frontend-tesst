import { resolveAfter } from '@/shared/api/apiClient'
import { refunds } from '@/shared/api/mockData'

export const refundsApi = {
  getRefunds: () => resolveAfter(refunds),
  getRefundDetail: (id: string) => resolveAfter(refunds.find((refund) => refund.id === id) ?? refunds[0]),
  createRefundRequest: async ({ reason }: { reason: string }) => {
    refunds.unshift({
      id: `refund-${refunds.length + 1}`,
      bookingId: 'booking-1',
      amount: 320,
      status: 'draft',
      reason,
      createdAt: new Date().toISOString(),
      timeline: [{ label: 'Request created', date: new Date().toISOString(), status: 'complete' }],
    })
    return resolveAfter(refunds[0])
  },
}

