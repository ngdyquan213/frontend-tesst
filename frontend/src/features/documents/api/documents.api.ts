import { env } from '@/app/config/env'
import { apiClient, resolveAfter } from '@/shared/api/apiClient'
import { documents } from '@/shared/api/mockData'
import type { DocumentRecord } from '@/shared/types/common'

function cloneDocumentRecord(document: DocumentRecord): DocumentRecord {
  return { ...document }
}

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
    if (env.enableMocks) {
      return resolveAfter(documents.map(cloneDocumentRecord))
    }

    const response = await apiClient.getUserDocuments()
    return response.map(mapApiDocumentToRecord)
  },
  getDocumentDetail: async (id: string) => {
    if (env.enableMocks) {
      const document = documents.find((item) => item.id === id)

      if (!document) {
        throw new Error('Document not found.')
      }

      return resolveAfter(document)
    }

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
    if (env.enableMocks) {
      const nextDocument: DocumentRecord = {
        id: `document-${documents.length + 1}`,
        bookingId: 'booking-1',
        title: file.name,
        type: formatDocumentType(documentType),
        uploadedAt: new Date().toISOString(),
        status: 'pending',
        notes: 'Queued for review.',
      }
      documents.unshift(nextDocument)
      return resolveAfter(cloneDocumentRecord(nextDocument))
    }

    const document = await apiClient.uploadDocument(documentType, file)
    return mapApiDocumentToRecord(document)
  },
}
