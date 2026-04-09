import { create } from 'zustand'
import { apiClient } from '@/shared/api/apiClient'
import { buildAuthStoreSessionState, clearMockAuthSession, getStoredMockAuthState, persistMockAuthResponse } from '@/shared/api/mockSession'
import { isMockApiEnabled } from '@/shared/api/mockMode'
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
  persistMockAuthResponse(response)
}

function clearPersistedAuth() {
  clearMockAuthSession()
}

const initialMockAuthState = getStoredMockAuthState()

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: initialMockAuthState.token,
  refreshToken: initialMockAuthState.refreshToken,
  isAuthenticated: initialMockAuthState.isAuthenticated,
  isInitializing: true,
  isLoading: false,
  error: null,

  initializeAuth: async () => {
    const storedState = getStoredMockAuthState()
    const token = storedState.token ?? get().token
    const refreshToken = storedState.refreshToken ?? get().refreshToken

    if (isMockApiEnabled() && !token && !refreshToken) {
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
      const user = await apiClient.restoreSession()

      if (!user) {
        clearPersistedAuth()
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
        token,
        refreshToken,
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
      set(buildAuthStoreSessionState(response))
      const user = response.user ?? await apiClient.getMe()

      set({
        user,
        ...buildAuthStoreSessionState(response),
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
      set(buildAuthStoreSessionState(response))
      const user = response.user ?? await apiClient.getMe()

      set({
        user,
        ...buildAuthStoreSessionState(response),
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
