import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/features/profile/api/profile.api'
import { profileKeys } from '@/features/profile/queries/profileKeys'

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

