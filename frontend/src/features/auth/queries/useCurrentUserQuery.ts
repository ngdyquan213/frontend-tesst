import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/AuthProvider'
import { authKeys } from '@/features/auth/queries/authKeys'

export const useCurrentUserQuery = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: authKeys.detail('current'),
    queryFn: async () => user,
    initialData: user,
  })
}

