import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/features/documents/api/documents.api'
import { documentKeys } from '@/features/documents/queries/documentKeys'

export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: documentsApi.uploadDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}

