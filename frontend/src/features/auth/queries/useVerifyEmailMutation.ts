import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { apiClient } from '@/shared/api/apiClient'

export const useVerifyEmailMutation = () =>
  useMutation({
    mutationFn: async ({ token }: { token: string }) => authApi.verifyEmail(token),
    onSuccess: async () => {
      const currentUser = useAuthStore.getState().user
      if (!currentUser) {
        return
      }

      try {
        const refreshedUser = await apiClient.getMe()
        useAuthStore.setState({ user: refreshedUser })
      } catch {
        useAuthStore.setState({
          user: {
            ...currentUser,
            email_verified: true,
          },
        })
      }
    },
  })
