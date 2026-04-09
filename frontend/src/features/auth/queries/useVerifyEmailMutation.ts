import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'

export const useVerifyEmailMutation = () =>
  useMutation({
    mutationFn: async ({ token }: { token: string }) => authApi.verifyEmail(token),
  })
