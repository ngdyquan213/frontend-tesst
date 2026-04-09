import { isMockApiEnabled } from '@/shared/api/mockMode'
import { authStorage } from '@/shared/storage/auth.storage'
import type { AuthResponse } from '@/shared/types/api'

export function getStoredMockAuthState() {
  const token = isMockApiEnabled() ? authStorage.getAccessToken() : null
  const refreshToken = isMockApiEnabled() ? authStorage.getRefreshToken() : null

  return {
    token,
    refreshToken,
    isAuthenticated: Boolean(token),
  }
}

export function getMockSessionAccessToken(fallback?: string | null) {
  return authStorage.getAccessToken() ?? fallback ?? null
}

export function getMockSessionRefreshToken(fallback?: string | null) {
  return authStorage.getRefreshToken() ?? fallback ?? null
}

export function persistMockAuthResponse(response: AuthResponse) {
  if (!isMockApiEnabled()) {
    return
  }

  authStorage.setAccessToken(response.access_token)
  if (response.refresh_token) {
    authStorage.setRefreshToken(response.refresh_token)
  }
  authStorage.setTokenType(response.token_type)
  authStorage.setTokenExpiresAt(String(Date.now() + (response.expires_in ?? 60 * 60) * 1000))
}

export function clearMockAuthSession() {
  authStorage.clearAuth()
}

export function buildAuthStoreSessionState(response: AuthResponse) {
  if (!isMockApiEnabled()) {
    return {
      token: null,
      refreshToken: null,
      isAuthenticated: true,
    }
  }

  return {
    token: response.access_token,
    refreshToken: response.refresh_token ?? authStorage.getRefreshToken(),
    isAuthenticated: true,
  }
}
