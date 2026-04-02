export const sampleCredentials = {
  traveler: 'alex@travelbook.com',
  admin: 'admin@travelbook.com',
}

import { create } from 'zustand'
import { apiClient } from '@/shared/api/apiClient'
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
  localStorage.setItem('access_token', response.access_token)
  if (response.refresh_token) {
    localStorage.setItem('refresh_token', response.refresh_token)
  }
  localStorage.setItem('token_type', response.token_type)
  localStorage.setItem(
    'token_expires_at',
    String(Date.now() + (response.expires_in ?? 60 * 60) * 1000)
  )
}

function clearPersistedAuth() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('token_type')
  localStorage.removeItem('token_expires_at')
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: Boolean(localStorage.getItem('access_token')),
  isInitializing: true,
  isLoading: false,
  error: null,

  initializeAuth: async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
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
      const user = await apiClient.getMe()
      set({
        user,
        token,
        refreshToken: localStorage.getItem('refresh_token'),
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
      const user = response.user ?? await apiClient.getMe()

      set({
        user,
        token: response.access_token,
        refreshToken: response.refresh_token ?? localStorage.getItem('refresh_token'),
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
      const user = response.user ?? await apiClient.getMe()

      set({
        user,
        token: response.access_token,
        refreshToken: response.refresh_token ?? localStorage.getItem('refresh_token'),
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
