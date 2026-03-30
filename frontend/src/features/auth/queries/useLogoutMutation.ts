import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/AuthProvider'

export const useLogoutMutation = () => {
  const { logout } = useAuth()
  return useMutation({
    mutationFn: async () => logout(),
  })
}

