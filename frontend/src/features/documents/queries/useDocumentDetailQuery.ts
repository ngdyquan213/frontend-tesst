import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/features/documents/api/documents.api'
import { documentKeys } from '@/features/documents/queries/documentKeys'

export const useDocumentDetailQuery = (id?: string) =>
  useQuery({
    queryKey: documentKeys.detail(id ?? 'missing'),
    queryFn: async () => {
      if (!id) {
        throw new Error('Missing document id.')
      }

      return documentsApi.getDocumentDetail(id)
    },
    enabled: Boolean(id),
  })
