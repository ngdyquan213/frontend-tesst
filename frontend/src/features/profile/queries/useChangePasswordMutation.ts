import { useMutation } from '@tanstack/react-query'
import { profileApi } from '@/features/profile/api/profile.api'

export const useChangePasswordMutation = () =>
  useMutation({
    mutationFn: profileApi.changePassword,
  })

