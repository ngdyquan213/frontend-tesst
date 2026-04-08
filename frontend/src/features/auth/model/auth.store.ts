import { create } from 'zustand'
import { env } from '@/app/config/env'
import { apiClient } from '@/shared/api/apiClient'
import { authStorage } from '@/shared/storage/auth.storage'
import type { AuthResponse, User } from '@/shared/types/api'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  isLoading: boolean
  error: string | null
  initializeAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const responseMessage = (error as { response?: { data?: { message?: unknown } } }).response?.data
      ?.message

    if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
      return responseMessage
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function persistAuth(response: AuthResponse) {
  if (!env.enableMocks) {
    return
  }

  authStorage.setAccessToken(response.access_token)
  if (response.refresh_token) {
    authStorage.setRefreshToken(response.refresh_token)
  }
  authStorage.setTokenType(response.token_type)
  authStorage.setTokenExpiresAt(String(Date.now() + (response.expires_in ?? 60 * 60) * 1000))
}

function clearPersistedAuth() {
  authStorage.clearAuth()
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: env.enableMocks ? authStorage.getAccessToken() : null,
  refreshToken: env.enableMocks ? authStorage.getRefreshToken() : null,
  isAuthenticated: env.enableMocks ? Boolean(authStorage.getAccessToken()) : false,
  isInitializing: true,
  isLoading: false,
  error: null,

  initializeAuth: async () => {
    const token = env.enableMocks ? authStorage.getAccessToken() : null

    if (env.enableMocks && !token) {
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isInitializing: false,
      })
      return
    }

    try {
      const user = await apiClient.getMe({ skipAuthRedirect: true })
      set({
        user,
        token,
        refreshToken: env.enableMocks ? authStorage.getRefreshToken() : null,
        isAuthenticated: true,
        isInitializing: false,
      })
    } catch {
      clearPersistedAuth()
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isInitializing: false,
      })
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await apiClient.login(email, password)
      persistAuth(response)
      set({
        token: env.enableMocks ? response.access_token : null,
        refreshToken: env.enableMocks ? response.refresh_token ?? authStorage.getRefreshToken() : null,
        isAuthenticated: true,
      })
      const user = response.user ?? await apiClient.getMe()

      set({
        user,
        token: env.enableMocks ? response.access_token : null,
        refreshToken: env.enableMocks ? response.refresh_token ?? authStorage.getRefreshToken() : null,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Login failed')
      set({ error: message, isLoading: false })
      throw error
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null })

    try {
      await apiClient.register(email, password, name)
      const response = await apiClient.login(email, password)
      persistAuth(response)
      set({
        token: env.enableMocks ? response.access_token : null,
        refreshToken: env.enableMocks ? response.refresh_token ?? authStorage.getRefreshToken() : null,
        isAuthenticated: true,
      })
      const user = response.user ?? await apiClient.getMe()

      set({
        user,
        token: env.enableMocks ? response.access_token : null,
        refreshToken: env.enableMocks ? response.refresh_token ?? authStorage.getRefreshToken() : null,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Registration failed')
      set({ error: message, isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })

    try {
      await apiClient.logout()
    } catch {
      // Logout should always clear local auth state even if the API call fails.
    } finally {
      clearPersistedAuth()
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))
