import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'

export const useResetPasswordMutation = () =>
  useMutation({
    mutationFn: async ({ password, token }: { password: string; token: string }) =>
      authApi.resetPassword(token, password),
  })
