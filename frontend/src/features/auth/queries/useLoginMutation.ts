import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/AuthProvider'

export const useLoginMutation = () => {
  const { login } = useAuth()
  return useMutation({
    mutationFn: login,
  })
}

