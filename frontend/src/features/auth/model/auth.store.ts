import { create } from 'zustand'
import { apiClient } from '@/shared/api/apiClient'
import type { User } from '@/shared/types/api'

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

export function createUnauthenticatedAuthState() {
  return {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isInitializing: true,
    isLoading: false,
    error: null,
  } satisfies Pick<
    AuthState,
    'user' | 'token' | 'refreshToken' | 'isAuthenticated' | 'isInitializing' | 'isLoading' | 'error'
  >
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...createUnauthenticatedAuthState(),

  initializeAuth: async () => {
    const currentState = get()

    // Preserve a fully hydrated in-memory session instead of clobbering it
    // with a second restore call during provider bootstrap.
    if (currentState.isAuthenticated && currentState.user) {
      set({ isInitializing: false })
      return
    }

    try {
      const user = await apiClient.restoreSession()

      if (!user) {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isInitializing: false,
        })
        return
      }

      set({
        user,
        token: null,
        refreshToken: null,
        isAuthenticated: true,
        isInitializing: false,
      })
    } catch {
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
      const user = response.user ?? await apiClient.getMe()

      set({
        user,
        token: null,
        refreshToken: null,
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
      const user = response.user ?? await apiClient.getMe()

      set({
        user,
        token: null,
        refreshToken: null,
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
