import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { normalizeUser } from '@/shared/api/apiNormalizers'
import type * as types from '@/shared/types/api'

interface AuthUserApiOptions {
  skipAuthRedirectHeader: string
}

export function createAuthUserApi(
  client: AxiosInstance,
  options: AuthUserApiOptions,
) {
  const { skipAuthRedirectHeader } = options

  const getMe = async (options?: { skipAuthRedirect?: boolean }): Promise<types.User> => {
    const response = await client.get('/users/me', {
      headers: options?.skipAuthRedirect
        ? { [skipAuthRedirectHeader]: 'true' }
        : undefined,
    })
    return normalizeUser(response.data)
  }

  return {
    async login(email: string, password: string): Promise<types.AuthResponse> {
      const response = await client.post('/auth/login', { email, password })
      return response.data
    },

    async register(email: string, password: string, name: string): Promise<types.User> {
      const response = await client.post('/auth/register', {
        email,
        password,
        full_name: name,
      })
      return normalizeUser(response.data)
    },

    async refreshToken(): Promise<types.TokenRefreshResponse> {
      const response = await client.post('/auth/refresh', {})
      return response.data
    },

    async restoreSession(): Promise<types.User | null> {
      try {
        return await getMe({ skipAuthRedirect: true })
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 401) {
          throw error
        }

        try {
          const refreshResponse = await client.post(
            '/auth/refresh',
            {},
            {
              headers: {
                [skipAuthRedirectHeader]: 'true',
              },
            },
          )
          const refreshedUser = refreshResponse.data?.user

          if (refreshedUser && typeof refreshedUser === 'object') {
            return normalizeUser(refreshedUser as Record<string, unknown>)
          }

          return await getMe({ skipAuthRedirect: true })
        } catch {
          return null
        }
      }
    },

    getMe,

    async updateMe(payload: { full_name: string }): Promise<types.User> {
      const response = await client.put('/users/me', payload)
      return normalizeUser(response.data)
    },

    async logout(): Promise<void> {
      await client.post('/auth/logout', {})
    },

    async logoutAll(): Promise<void> {
      await client.post('/auth/logout-all')
    },

    async changeMyPassword(payload: {
      current_password: string
      new_password: string
    }): Promise<void> {
      await client.post('/users/me/change-password', payload)
    },

    async forgotPassword(email: string): Promise<{ email: string }> {
      await client.post('/auth/forgot-password', { email })
      return { email }
    },

    async resetPassword(password: string, token?: string): Promise<boolean> {
      if (!token?.trim()) {
        throw new Error('Password reset token is required.')
      }

      await client.post('/auth/reset-password', { token: token.trim(), password })
      return true
    },

    async verifyEmail(token?: string): Promise<boolean> {
      if (!token?.trim()) {
        throw new Error('Email verification token is required.')
      }

      await client.post('/auth/verify-email', { token: token.trim() })
      return true
    },
  }
}
