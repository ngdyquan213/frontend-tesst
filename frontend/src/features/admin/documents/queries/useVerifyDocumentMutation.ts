import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminDocumentsApi } from '@/features/admin/documents/api/adminDocuments.api'
import { adminDocumentKeys } from '@/features/admin/documents/queries/adminDocumentKeys'

export const useVerifyDocumentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminDocumentsApi.reviewDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminDocumentKeys.all })
    },
  })
}
