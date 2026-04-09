import type * as types from '@/shared/types/api'

const MOCK_ACCESS_TOKEN_PREFIX = 'mock-access-token:'
const MOCK_REFRESH_TOKEN_PREFIX = 'mock-refresh-token:'
export const MOCK_DEFAULT_TRAVELER_NAME = 'Alexander Sterling'

const MOCK_SEEDED_USERS = {
  traveler: {
    id: 'user-1',
    name: MOCK_DEFAULT_TRAVELER_NAME,
    email: 'alex@travelbook.com',
    role: 'traveler',
  },
  admin: {
    id: 'admin-1',
    name: 'Alex Rivera',
    email: 'admin@travelbook.com',
    role: 'admin',
  },
} as const

function createMockApiUser(name: string, email: string, role: string, id: string): types.User {
  const now = new Date().toISOString()

  return {
    id,
    email,
    name,
    role,
    roles: [role],
    permissions: role === 'admin' ? ['admin:*'] : [],
    created_at: now,
    updated_at: now,
  }
}

const mockAuthUsersById = new Map<string, types.User>()
const mockAuthUsersByEmail = new Map<string, types.User>()

function seedMockAuthUsers() {
  const seededUsers = [
    createMockApiUser(
      MOCK_SEEDED_USERS.traveler.name,
      MOCK_SEEDED_USERS.traveler.email,
      MOCK_SEEDED_USERS.traveler.role,
      MOCK_SEEDED_USERS.traveler.id,
    ),
    createMockApiUser(
      MOCK_SEEDED_USERS.admin.name,
      MOCK_SEEDED_USERS.admin.email,
      MOCK_SEEDED_USERS.admin.role,
      MOCK_SEEDED_USERS.admin.id,
    ),
  ]

  for (const user of seededUsers) {
    mockAuthUsersById.set(user.id, user)
    mockAuthUsersByEmail.set(user.email.toLowerCase(), user)
  }
}

seedMockAuthUsers()

function buildMockAuthResponse(user: types.User): types.AuthResponse {
  return {
    user,
    access_token: `${MOCK_ACCESS_TOKEN_PREFIX}${user.id}`,
    refresh_token: `${MOCK_REFRESH_TOKEN_PREFIX}${user.id}`,
    token_type: 'Bearer',
    expires_in: 60 * 60,
  }
}

function getMockUserIdFromToken(token: string | null | undefined, prefix: string) {
  if (!token || !token.startsWith(prefix)) {
    return null
  }

  return token.slice(prefix.length)
}

function getMockUserFromToken(token: string | null | undefined, prefix: string) {
  const userId = getMockUserIdFromToken(token, prefix)
  return userId ? mockAuthUsersById.get(userId) ?? null : null
}

function requireMockUser(token: string | null | undefined, prefix: string) {
  const user = getMockUserFromToken(token, prefix)

  if (!user) {
    throw new Error('Mock session is invalid or has expired.')
  }

  return user
}

export const mockAuth = {
  buildAuthResponse: buildMockAuthResponse,
  createUser(name: string, email: string, role: string, id: string) {
    return createMockApiUser(name, email, role, id)
  },
  getUserByEmail(email: string) {
    return mockAuthUsersByEmail.get(email.trim().toLowerCase()) ?? null
  },
  persistUser(user: types.User) {
    mockAuthUsersById.set(user.id, user)
    mockAuthUsersByEmail.set(user.email.toLowerCase(), user)
  },
  hasUserByEmail(email: string) {
    return mockAuthUsersByEmail.has(email.trim().toLowerCase())
  },
  requireAccessUser(token: string | null | undefined) {
    return requireMockUser(token, MOCK_ACCESS_TOKEN_PREFIX)
  },
  requireRefreshUser(token: string | null | undefined) {
    return requireMockUser(token, MOCK_REFRESH_TOKEN_PREFIX)
  },
}
