import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'

export const useRegisterMutation = () =>
  useMutation({
    mutationFn: async ({ email }: { email: string; name: string; password: string }) => authApi.register(email),
  })

