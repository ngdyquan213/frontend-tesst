import { useMutation } from '@tanstack/react-query'
import { adminDocumentsApi } from '@/features/admin/documents/api/adminDocuments.api'

export const useVerifyDocumentMutation = () =>
  useMutation({
    mutationFn: adminDocumentsApi.verifyDocument,
  })

