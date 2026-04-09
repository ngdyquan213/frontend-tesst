import type { AxiosInstance } from 'axios'
import {
  normalizeDocument,
  normalizeRecordArray,
  normalizeSupportTicket,
  normalizeSupportTicketDetail,
  toNumber,
} from '@/shared/api/apiNormalizers'
import type * as types from '@/shared/types/api'

export function createSupportDocumentsApi(client: AxiosInstance) {
  return {
    async getSupportTickets(limit = 20, offset = 0): Promise<{ tickets: types.SupportTicket[]; total: number }> {
      const response = await client.get('/support/tickets', {
        params: { page: Math.floor(offset / limit) + 1, page_size: limit },
      })

      return {
        tickets: normalizeRecordArray(response.data, 'tickets', normalizeSupportTicket),
        total:
          response.data && typeof response.data === 'object' && 'total' in response.data
            ? toNumber((response.data as Record<string, unknown>).total)
            : 0,
      }
    },

    async getSupportTicket(id: string): Promise<types.SupportTicketDetail> {
      const response = await client.get(`/support/tickets/${id}`)
      return normalizeSupportTicketDetail(response.data)
    },

    async replyToSupportTicket(
      id: string,
      payload: types.SupportTicketReplyCreateRequest,
    ): Promise<types.SupportTicketDetail> {
      const response = await client.post(`/support/tickets/${id}/replies`, payload)
      return normalizeSupportTicketDetail(response.data)
    },

    async createSupportTicket(payload: types.CreateSupportTicketRequest): Promise<types.SupportTicket> {
      const response = await client.post('/support/tickets', payload)
      return normalizeSupportTicket(response.data)
    },

    async getAdminSupportTickets(
      limit = 20,
      offset = 0,
      status?: string,
    ): Promise<{ tickets: types.SupportTicket[]; total: number }> {
      const response = await client.get('/support/admin/tickets', {
        params: {
          page: Math.floor(offset / limit) + 1,
          page_size: limit,
          status,
        },
      })

      return {
        tickets: normalizeRecordArray(response.data, 'tickets', normalizeSupportTicket),
        total:
          response.data && typeof response.data === 'object' && 'total' in response.data
            ? toNumber((response.data as Record<string, unknown>).total)
            : 0,
      }
    },

    async getAdminSupportTicket(id: string): Promise<types.SupportTicketDetail> {
      const response = await client.get(`/support/admin/tickets/${id}`)
      return normalizeSupportTicketDetail(response.data)
    },

    async replyToAdminSupportTicket(
      id: string,
      payload: types.SupportTicketReplyCreateRequest,
    ): Promise<types.SupportTicketDetail> {
      const response = await client.post(`/support/admin/tickets/${id}/replies`, payload)
      return normalizeSupportTicketDetail(response.data)
    },

    async updateAdminSupportTicket(
      id: string,
      payload: types.AdminSupportTicketUpdateRequest,
    ): Promise<types.SupportTicketDetail> {
      const response = await client.put(`/support/admin/tickets/${id}`, payload)
      return normalizeSupportTicketDetail(response.data)
    },

    async uploadDocument(documentType: string, file: File): Promise<types.Document> {
      const formData = new FormData()
      formData.append('document_type', documentType.trim().toLowerCase())
      formData.append('file', file)

      const response = await client.post('/uploads/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return normalizeDocument(response.data)
    },

    async getUserDocuments(): Promise<types.Document[]> {
      const response = await client.get('/uploads/documents')
      return normalizeRecordArray(response.data, 'documents', normalizeDocument)
    },

    async downloadDocument(id: string): Promise<Blob> {
      const response = await client.get(`/uploads/documents/${id}/download`, {
        responseType: 'blob',
      })

      return response.data as Blob
    },

    async downloadVoucherPdf(bookingId: string): Promise<Blob> {
      const response = await client.get(`/bookings/${bookingId}/voucher.pdf`, {
        responseType: 'blob',
      })

      return response.data as Blob
    },

    async getNotifications(): Promise<types.NotificationListResponse> {
      const response = await client.get('/notifications')
      return response.data
    },

    async markNotificationRead(notificationId: string): Promise<types.NotificationItemResponse> {
      const response = await client.post(`/notifications/${notificationId}/read`)
      return response.data
    },

    async markAllNotificationsRead(): Promise<types.NotificationListResponse> {
      const response = await client.post('/notifications/read-all')
      return response.data
    },
  }
}
