import { mapApiUserToAppUser } from '@/shared/lib/auth'
import { apiClient } from '@/shared/api/apiClient'

export const profileApi = {
  getProfile: async () => {
    const user = await apiClient.getMe()
    return mapApiUserToAppUser(user)
  },
  updateProfile: async (payload: { name: string }) => {
    const user = await apiClient.updateMe({ full_name: payload.name })
    return mapApiUserToAppUser(user)
  },
  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    await apiClient.changeMyPassword({
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
    })
  },
}
