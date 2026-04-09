import { mockAuth } from '@/shared/api/mockAuth'
import { buildAuthStoreSessionState, getMockSessionAccessToken, getMockSessionRefreshToken, persistMockAuthResponse } from '@/shared/api/mockSession'
import { resolveAfter } from '@/shared/api/resolveAfter'
import type * as types from '@/shared/types/api'

type AuthStateAdapter = {
  setState: (state: Partial<{ token: string | null; refreshToken: string | null; isAuthenticated: boolean }>) => void
  getState: () => { token: string | null; refreshToken: string | null }
}

export const mockAuthClient = {
  async login(email: string, password: string): Promise<types.AuthResponse> {
    if (!password.trim()) {
      throw new Error('Password is required.')
    }

    const user = mockAuth.getUserByEmail(email)

    if (!user) {
      throw new Error('Invalid email or password.')
    }

    return resolveAfter(mockAuth.buildAuthResponse(user))
  },

  async register(email: string, password: string, name: string): Promise<types.User> {
    if (!password.trim()) {
      throw new Error('Password is required.')
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (mockAuth.hasUserByEmail(normalizedEmail)) {
      throw new Error('An account with this email already exists.')
    }

    const user = mockAuth.createUser(
      name.trim() || normalizedEmail,
      normalizedEmail,
      'traveler',
      `user-${Date.now()}`,
    )
    mockAuth.persistUser(user)
    return resolveAfter(user)
  },

  async refreshToken(adapter: AuthStateAdapter): Promise<types.TokenRefreshResponse> {
    const refreshToken = getMockSessionRefreshToken(adapter.getState().refreshToken)
    const user = mockAuth.requireRefreshUser(refreshToken)
    const response = mockAuth.buildAuthResponse(user)
    persistMockAuthResponse(response)
    adapter.setState(buildAuthStoreSessionState(response))
    return resolveAfter(response)
  },

  async getMe(token?: string | null): Promise<types.User> {
    const user = mockAuth.requireAccessUser(getMockSessionAccessToken(token))
    return resolveAfter(user)
  },

  async updateMe(payload: { full_name: string }, token?: string | null): Promise<types.User> {
    const user = mockAuth.requireAccessUser(getMockSessionAccessToken(token))
    const nextUser = {
      ...user,
      name: payload.full_name.trim(),
      full_name: payload.full_name.trim(),
      updated_at: new Date().toISOString(),
    }
    mockAuth.persistUser(nextUser)
    return resolveAfter(nextUser)
  },

  async forgotPassword(email: string): Promise<{ email: string }> {
    return resolveAfter({ email })
  },

  async resetPassword(): Promise<boolean> {
    return resolveAfter(true)
  },
}
