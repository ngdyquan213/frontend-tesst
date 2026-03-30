import { resolveAfter } from '@/shared/api/apiClient'
import { documents } from '@/shared/api/mockData'

export const adminDocumentsApi = {
  getDocuments: () => resolveAfter(documents),
  verifyDocument: async () => resolveAfter(documents[0]),
}

