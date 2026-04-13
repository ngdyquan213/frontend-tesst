import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { adminDocumentsApi } from '@/features/admin/documents/api/adminDocuments.api'
import { adminDocumentKeys } from '@/features/admin/documents/queries/adminDocumentKeys'

export const useAdminDocumentsQuery = (page = 1, pageSize = 10) =>
  useQuery({
    queryKey: adminDocumentKeys.list({ page, pageSize }),
    queryFn: () => adminDocumentsApi.getDocuments(page, pageSize),
    placeholderData: keepPreviousData,
  })
