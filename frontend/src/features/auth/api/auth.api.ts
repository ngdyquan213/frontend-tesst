import { resolveAfter } from '@/shared/api/apiClient'

export const authApi = {
  login: (email: string) => resolveAfter({ email }),
  register: (email: string) => resolveAfter({ email }),
  forgotPassword: (email: string) => resolveAfter({ email }),
  resetPassword: () => resolveAfter(true),
}

