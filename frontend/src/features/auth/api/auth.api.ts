import { apiClient } from '@/shared/api/apiClient'

export const authApi = {
  forgotPassword: (email: string) => apiClient.forgotPassword(email),
  resetPassword: (token: string, password: string) => apiClient.resetPassword(password, token),
  verifyEmail: (token: string) => apiClient.verifyEmail(token),
}
