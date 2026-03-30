import { useQuery } from '@tanstack/react-query'
import { profileApi } from '@/features/profile/api/profile.api'
import { profileKeys } from '@/features/profile/queries/profileKeys'

export const useProfileQuery = () =>
  useQuery({
    queryKey: profileKeys.detail('me'),
    queryFn: profileApi.getProfile,
  })

