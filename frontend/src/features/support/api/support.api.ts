import { resolveAfter } from '@/shared/api/apiClient'
import { supportTickets } from '@/shared/api/mockData'

export const supportApi = {
  getSupportTickets: () => resolveAfter(supportTickets),
  getSupportTicketDetail: (id: string) => resolveAfter(supportTickets.find((ticket) => ticket.id === id) ?? supportTickets[0]),
  createSupportTicket: async ({ subject, body }: { subject: string; body: string }) => {
    supportTickets.unshift({
      id: `ticket-${supportTickets.length + 1}`,
      subject,
      status: 'open',
      updatedAt: new Date().toISOString(),
      messages: [{ from: 'user', body, timestamp: new Date().toISOString() }],
    })
    return resolveAfter(supportTickets[0])
  },
}

