import { isMockApiEnabled } from '@/shared/api/mockMode'

const AUTH_STORAGE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  tokenType: 'token_type',
  tokenExpiresAt: 'token_expires_at',
} as const

function isPersistentBrowserStorageEnabled() {
  return isMockApiEnabled()
}

function getSessionStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function getLegacyStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readItem(key: string) {
  if (!isPersistentBrowserStorageEnabled()) {
    return null
  }

  const sessionStorage = getSessionStorage()
  const legacyStorage = getLegacyStorage()
  const sessionValue = sessionStorage?.getItem(key)

  if (sessionValue !== null && sessionValue !== undefined) {
    return sessionValue
  }

  const legacyValue = legacyStorage?.getItem(key)

  if (legacyValue !== null && legacyValue !== undefined) {
    sessionStorage?.setItem(key, legacyValue)
    legacyStorage?.removeItem(key)
    return legacyValue
  }

  return null
}

function writeItem(key: string, value: string) {
  if (!isPersistentBrowserStorageEnabled()) {
    return
  }

  const sessionStorage = getSessionStorage()
  const legacyStorage = getLegacyStorage()

  if (sessionStorage) {
    sessionStorage.setItem(key, value)
    legacyStorage?.removeItem(key)
    return
  }

  legacyStorage?.setItem(key, value)
}

function removeItem(key: string) {
  getSessionStorage()?.removeItem(key)
  getLegacyStorage()?.removeItem(key)
}

function clearLegacyBrowserAuthState() {
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => removeItem(key))
}

if (typeof window !== 'undefined' && !isPersistentBrowserStorageEnabled()) {
  clearLegacyBrowserAuthState()
}

export const authStorage = {
  getAccessToken: () => readItem(AUTH_STORAGE_KEYS.accessToken),
  setAccessToken: (value: string) => writeItem(AUTH_STORAGE_KEYS.accessToken, value),
  getRefreshToken: () => readItem(AUTH_STORAGE_KEYS.refreshToken),
  setRefreshToken: (value: string) => writeItem(AUTH_STORAGE_KEYS.refreshToken, value),
  getTokenType: () => readItem(AUTH_STORAGE_KEYS.tokenType),
  setTokenType: (value: string) => writeItem(AUTH_STORAGE_KEYS.tokenType, value),
  getTokenExpiresAt: () => readItem(AUTH_STORAGE_KEYS.tokenExpiresAt),
  setTokenExpiresAt: (value: string) => writeItem(AUTH_STORAGE_KEYS.tokenExpiresAt, value),
  clearAuth: () => {
    removeItem(AUTH_STORAGE_KEYS.accessToken)
    removeItem(AUTH_STORAGE_KEYS.refreshToken)
    removeItem(AUTH_STORAGE_KEYS.tokenType)
    removeItem(AUTH_STORAGE_KEYS.tokenExpiresAt)
  },
}
