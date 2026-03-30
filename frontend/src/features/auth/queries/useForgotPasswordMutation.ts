import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'

export const useForgotPasswordMutation = () =>
  useMutation({
    mutationFn: async ({ email }: { email: string }) => authApi.forgotPassword(email),
  })

