import { env } from '@/app/config/env'
import { apiClient, resolveAfter } from '@/shared/api/apiClient'
import { documents } from '@/shared/api/mockData'

function mapAdminDocument(document: Awaited<ReturnType<typeof apiClient.getAdminDocuments>>[number]) {
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
  getDocuments: async () => {
    if (env.enableMocks) {
      return resolveAfter(documents.map((document) => ({ ...document })))
    }

    const response = await apiClient.getAdminDocuments()
    return response.map(mapAdminDocument)
  },
  reviewDocument: async ({
    documentId,
    status,
  }: {
    documentId: string
    status: 'approved' | 'rejected'
  }) => {
    if (env.enableMocks) {
      const nextStatus = status === 'approved' ? 'verified' : 'rejected'
      const document = documents.find((item) => item.id === documentId)

      if (!document) {
        throw new Error(`Document ${documentId} was not found in the moderation queue.`)
      }

      document.status = nextStatus
      return resolveAfter({ ...document })
    }

    const document = await apiClient.reviewAdminDocument(documentId, status)
    return mapAdminDocument(document)
  },
}
