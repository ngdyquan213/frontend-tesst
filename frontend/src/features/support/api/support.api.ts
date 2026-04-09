import { getMockSupportTicket, mapApiSupportTicket, mapApiSupportTicketDetail, mapMockSupportTicket, mapMockSupportTicketDetail, normalizeSupportStatus } from '@/features/support/lib/supportMappers'
import { supportFaqs, supportHelpTopics } from '@/features/support/lib/supportContent'
import { apiClient } from '@/shared/api/apiClient'
import { resolveMockable } from '@/shared/api/mockApi'
import { resolveAfter } from '@/shared/api/resolveAfter'
import type {
  CreateSupportReplyPayload,
  SupportTicket as AppSupportTicket,
  SupportTicketDetail as AppSupportTicketDetail,
  CreateSupportTicketPayload,
  UpdateSupportTicketStatusPayload,
} from '@/features/support/model/support.types'
import type { SupportTicket as MockSupportTicket } from '@/shared/types/common'

export const supportApi = {
  getSupportTickets: async (): Promise<AppSupportTicket[]> =>
    resolveMockable({
      mock: ({ supportTickets }) => supportTickets.map(mapMockSupportTicket),
      live: async () => {
        const response = await apiClient.getSupportTickets()
        return response.tickets.map(mapApiSupportTicket)
      },
    }),
  getSupportTicketDetail: async (id: string): Promise<AppSupportTicketDetail> =>
    resolveMockable({
      mock: ({ supportTickets }) => {
        const ticket = getMockSupportTicket(supportTickets, id)
        return mapMockSupportTicketDetail(ticket)
      },
      live: async () => {
        const response = await apiClient.getSupportTicket(id)
        return mapApiSupportTicketDetail(response)
      },
    }),
  replyToSupportTicket: async (
    id: string,
    payload: CreateSupportReplyPayload,
  ): Promise<AppSupportTicketDetail> =>
    resolveMockable({
      mock: ({ supportTickets }) => {
        const ticket = getMockSupportTicket(supportTickets, id)
        ticket.status = 'open'
        ticket.updatedAt = new Date().toISOString()
        ticket.messages.push({
          from: 'user',
          body: payload.message.trim(),
          timestamp: ticket.updatedAt,
        })
        return mapMockSupportTicketDetail(ticket)
      },
      live: async () => {
        const response = await apiClient.replyToSupportTicket(id, {
          message: payload.message.trim(),
        })
        return mapApiSupportTicketDetail(response)
      },
    }),
  createSupportTicket: async (payload: CreateSupportTicketPayload): Promise<AppSupportTicket> => {
    const normalizedBookingReference = payload.bookingReference?.trim() ?? ''

    return resolveMockable({
      mock: ({ bookings, supportTickets }) => {
        const matchedBooking = bookings.find(
          (booking) => booking.reference.toLowerCase() === normalizedBookingReference.toLowerCase(),
        )
        const createdTicket: MockSupportTicket = {
          id: `ticket-${supportTickets.length + 1}`,
          reference: `SR-${String(supportTickets.length + 1).padStart(4, '0')}`,
          subject: payload.subject.trim(),
          fullName: payload.fullName.trim(),
          email: payload.email.trim(),
          topicId: payload.topicId.trim() || undefined,
          bookingReference: normalizedBookingReference || undefined,
          bookingId: matchedBooking?.id,
          status: 'open',
          updatedAt: new Date().toISOString(),
          messages: [{ from: 'user', body: payload.message.trim(), timestamp: new Date().toISOString() }],
        }

        supportTickets.unshift(createdTicket)
        return mapMockSupportTicket(createdTicket)
      },
      live: async () => {
        const response = await apiClient.createSupportTicket({
          full_name: payload.fullName.trim(),
          email: payload.email.trim(),
          topic_id: payload.topicId.trim(),
          subject: payload.subject.trim(),
          message: payload.message.trim(),
          booking_reference: normalizedBookingReference || undefined,
        })
        return mapApiSupportTicket(response)
      },
    })
  },
  getAdminSupportTickets: async (status?: string): Promise<AppSupportTicket[]> =>
    resolveMockable({
      mock: ({ supportTickets }) =>
        supportTickets
          .filter((ticket) => !status || normalizeSupportStatus(ticket.status) === status)
          .map(mapMockSupportTicket),
      live: async () => {
        const response = await apiClient.getAdminSupportTickets(20, 0, status)
        return response.tickets.map(mapApiSupportTicket)
      },
    }),
  getAdminSupportTicketDetail: async (id: string): Promise<AppSupportTicketDetail> =>
    resolveMockable({
      mock: ({ supportTickets }) => mapMockSupportTicketDetail(getMockSupportTicket(supportTickets, id)),
      live: async () => {
        const response = await apiClient.getAdminSupportTicket(id)
        return mapApiSupportTicketDetail(response)
      },
    }),
  replyToAdminSupportTicket: async (
    id: string,
    payload: CreateSupportReplyPayload,
  ): Promise<AppSupportTicketDetail> =>
    resolveMockable({
      mock: ({ supportTickets }) => {
        const ticket = getMockSupportTicket(supportTickets, id)
        ticket.status = payload.status ?? 'waiting_for_traveler'
        ticket.updatedAt = new Date().toISOString()
        ticket.messages.push({
          from: 'agent',
          body: payload.message.trim(),
          timestamp: ticket.updatedAt,
        })
        return mapMockSupportTicketDetail(ticket)
      },
      live: async () => {
        const response = await apiClient.replyToAdminSupportTicket(id, {
          message: payload.message.trim(),
          status: payload.status,
        })
        return mapApiSupportTicketDetail(response)
      },
    }),
  updateAdminSupportTicketStatus: async (
    id: string,
    payload: UpdateSupportTicketStatusPayload,
  ): Promise<AppSupportTicketDetail> =>
    resolveMockable({
      mock: ({ supportTickets }) => {
        const ticket = getMockSupportTicket(supportTickets, id)
        ticket.status = payload.status
        ticket.updatedAt = new Date().toISOString()
        return mapMockSupportTicketDetail(ticket)
      },
      live: async () => {
        const response = await apiClient.updateAdminSupportTicket(id, payload)
        return mapApiSupportTicketDetail(response)
      },
    }),
  getFaqs: async () =>
    resolveMockable({
      mock: async () => resolveAfter(supportFaqs),
      live: () => apiClient.getSupportFaqs(),
    }),
  getHelpTopics: async () =>
    resolveMockable({
      mock: async () => resolveAfter(supportHelpTopics),
      live: () => apiClient.getSupportHelpTopics(),
    }),
}
