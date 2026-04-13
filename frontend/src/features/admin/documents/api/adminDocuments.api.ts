import { apiClient } from '@/shared/api/apiClient'
import type { PaginatedResult } from '@/shared/types/pagination'

function mapAdminDocument(
  document: Awaited<ReturnType<typeof apiClient.getAdminDocuments>>['documents'][number],
) {
  const normalizedStatus = document.status?.toLowerCase()

  return {
    id: document.id,
    bookingId: document.booking_id ?? '',
    title: document.original_filename ?? document.file_name,
    type: document.document_type,
    uploadedAt: document.uploaded_at ?? document.upload_date,
    status:
      normalizedStatus === 'approved'
        ? ('verified' as const)
        : normalizedStatus === 'rejected'
          ? ('rejected' as const)
          : ('pending' as const),
    notes: `${document.document_type} document for booking ${document.booking_id ?? 'general account'}`,
  }
}

export const adminDocumentsApi = {
  getDocuments: async (
    page = 1,
    pageSize = 10,
  ): Promise<PaginatedResult<ReturnType<typeof mapAdminDocument>>> => {
    const offset = (page - 1) * pageSize
    const response = await apiClient.getAdminDocuments(pageSize, offset)

    return {
      items: response.documents.map(mapAdminDocument),
      meta: {
        page,
        pageSize,
        total: response.total,
      },
    }
  },
  reviewDocument: async ({
    documentId,
    status,
  }: {
    documentId: string
    status: 'approved' | 'rejected'
  }) => {
    const document = await apiClient.reviewAdminDocument(documentId, status)
    return mapAdminDocument(document)
  },
}
