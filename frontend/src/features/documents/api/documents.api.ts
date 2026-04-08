import { resolveAfter } from '@/shared/api/apiClient'
import { documents } from '@/shared/api/mockData'

export const documentsApi = {
  getDocuments: () => resolveAfter(documents),
  getDocumentDetail: async (id: string) => {
    const document = documents.find((item) => item.id === id)

    if (!document) {
      throw new Error('Document not found.')
    }

    return resolveAfter(document)
  },
  uploadDocument: async ({ title }: { title: string }) => {
    documents.unshift({
      id: `document-${documents.length + 1}`,
      bookingId: 'booking-1',
      title,
      type: 'Upload',
      uploadedAt: new Date().toISOString(),
      status: 'pending',
      notes: 'Queued for review.',
    })
    return resolveAfter(documents[0])
  },
  deleteDocument: async (id: string) => resolveAfter(documents.filter((document) => document.id !== id)),
}
