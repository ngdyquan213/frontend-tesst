import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/features/documents/api/documents.api'
import { documentKeys } from '@/features/documents/queries/documentKeys'

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}

