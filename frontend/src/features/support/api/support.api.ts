import { mapApiSupportTicket, mapApiSupportTicketDetail } from '@/features/support/lib/supportMappers'
import { apiClient } from '@/shared/api/apiClient'
import type {
  CreateSupportReplyPayload,
  SupportTicket as AppSupportTicket,
  SupportTicketDetail as AppSupportTicketDetail,
  CreateSupportTicketPayload,
  UpdateSupportTicketStatusPayload,
} from '@/features/support/model/support.types'

export const supportApi = {
  getSupportTickets: async (): Promise<AppSupportTicket[]> => {
    const response = await apiClient.getSupportTickets()
    return response.tickets.map(mapApiSupportTicket)
  },
  getSupportTicketDetail: async (id: string): Promise<AppSupportTicketDetail> => {
    const response = await apiClient.getSupportTicket(id)
    return mapApiSupportTicketDetail(response)
  },
  replyToSupportTicket: async (
    id: string,
    payload: CreateSupportReplyPayload,
  ): Promise<AppSupportTicketDetail> => {
    const response = await apiClient.replyToSupportTicket(id, {
      message: payload.message.trim(),
    })
    return mapApiSupportTicketDetail(response)
  },
  createSupportTicket: async (payload: CreateSupportTicketPayload): Promise<AppSupportTicket> => {
    const normalizedBookingReference = payload.bookingReference?.trim() ?? ''

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
  getAdminSupportTickets: async (status?: string): Promise<AppSupportTicket[]> => {
    const response = await apiClient.getAdminSupportTickets(20, 0, status)
    return response.tickets.map(mapApiSupportTicket)
  },
  getAdminSupportTicketDetail: async (id: string): Promise<AppSupportTicketDetail> => {
    const response = await apiClient.getAdminSupportTicket(id)
    return mapApiSupportTicketDetail(response)
  },
  replyToAdminSupportTicket: async (
    id: string,
    payload: CreateSupportReplyPayload,
  ): Promise<AppSupportTicketDetail> => {
    const response = await apiClient.replyToAdminSupportTicket(id, {
      message: payload.message.trim(),
      status: payload.status,
    })
    return mapApiSupportTicketDetail(response)
  },
  updateAdminSupportTicketStatus: async (
    id: string,
    payload: UpdateSupportTicketStatusPayload,
  ): Promise<AppSupportTicketDetail> => {
    const response = await apiClient.updateAdminSupportTicket(id, payload)
    return mapApiSupportTicketDetail(response)
  },
  getFaqs: async () => apiClient.getSupportFaqs(),
  getHelpTopics: async () => apiClient.getSupportHelpTopics(),
}
