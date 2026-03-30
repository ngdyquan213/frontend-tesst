import { useQuery } from '@tanstack/react-query'
import { adminDocumentsApi } from '@/features/admin/documents/api/adminDocuments.api'
import { adminDocumentKeys } from '@/features/admin/documents/queries/adminDocumentKeys'

export const useAdminDocumentsQuery = () =>
  useQuery({
    queryKey: adminDocumentKeys.list(),
    queryFn: adminDocumentsApi.getDocuments,
  })

