import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/AuthProvider'

export const useRegisterMutation = () => {
  const { register } = useAuth()
  return useMutation({
    mutationFn: register,
  })
}
