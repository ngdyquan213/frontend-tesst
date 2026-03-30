import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'

export const useResetPasswordMutation = () =>
  useMutation({
    mutationFn: async () => authApi.resetPassword(),
  })

