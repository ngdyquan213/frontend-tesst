import { resolveAfter } from '@/shared/api/apiClient'
import { users } from '@/shared/api/mockData'

export const profileApi = {
  getProfile: () => resolveAfter(users.traveler),
  updateProfile: async (payload: { name: string; location: string }) => {
    users.traveler.name = payload.name
    users.traveler.location = payload.location
    return resolveAfter(users.traveler)
  },
  changePassword: () => resolveAfter(true),
}

