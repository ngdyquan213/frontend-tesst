import { apiClient } from '@/shared/api/apiClient'
import type { DocumentRecord } from '@/shared/types/common'

function formatDocumentType(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function mapApiDocumentToRecord(
  document: Awaited<ReturnType<typeof apiClient.getUserDocuments>>[number],
): DocumentRecord {
  const uploadedAt = document.uploaded_at ?? document.upload_date ?? new Date().toISOString()
  const documentType = document.document_type ?? 'OTHER'
  const normalizedStatus: DocumentRecord['status'] =
    document.status?.toLowerCase() === 'approved'
      ? 'verified'
      : document.status?.toLowerCase() === 'rejected'
        ? 'rejected'
        : 'pending'

  return {
    id: document.id,
    bookingId: document.booking_id ?? '',
    title: document.original_filename ?? document.file_name,
    type: formatDocumentType(documentType),
    uploadedAt,
    status: normalizedStatus,
    notes:
      normalizedStatus === 'verified'
        ? `${formatDocumentType(documentType)} verified on ${new Date(uploadedAt).toLocaleDateString()}.`
        : normalizedStatus === 'rejected'
          ? `${formatDocumentType(documentType)} needs re-upload after review.`
          : `${formatDocumentType(documentType)} document uploaded on ${new Date(uploadedAt).toLocaleDateString()}.`,
  }
}

export const documentsApi = {
  getDocuments: async () => {
    const response = await apiClient.getUserDocuments()
    return response.map(mapApiDocumentToRecord)
  },
  getDocumentDetail: async (id: string) => {
    const records = await documentsApi.getDocuments()
    const document = records.find((item) => item.id === id)
    if (!document) {
      throw new Error('Document not found.')
    }

    return document
  },
  uploadDocument: async ({
    documentType,
    file,
    }: {
      documentType: string
      file: File
  }) => {
    const document = await apiClient.uploadDocument(documentType, file)
    return mapApiDocumentToRecord(document)
  },
}
