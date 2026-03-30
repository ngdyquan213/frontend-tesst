import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/features/documents/api/documents.api'
import { documentKeys } from '@/features/documents/queries/documentKeys'

export const useDocumentsQuery = () =>
  useQuery({
    queryKey: documentKeys.list(),
    queryFn: documentsApi.getDocuments,
  })

