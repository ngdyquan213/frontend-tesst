import type { User } from '@/shared/types/api'
import type { AppRole, AppUser } from '@/shared/types/common'

const ADMIN_ROLES = new Set(['admin', 'super_admin'])

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? ''
}

function buildInitials(name: string) {
  const segments = name
    .split(/\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return 'TB'
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('')
}

function buildMemberId(id: string, role: Exclude<AppRole, 'guest'>) {
  const suffix = id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'USER'
  return role === 'admin' ? `TB-OPS-${suffix}` : `TB-${suffix}`
}

export function hasAdminAccess(user?: Pick<User, 'role' | 'roles'> | Pick<AppUser, 'role'> | null) {
  if (!user) {
    return false
  }

  if ('roles' in user) {
    return [user.role, ...(user.roles ?? [])].some((role) => ADMIN_ROLES.has(normalizeRole(role)))
  }

  return ADMIN_ROLES.has(normalizeRole(user.role))
}

export function mapApiUserToAppUser(user: User): AppUser {
  const displayName =
    user.name?.trim() || user.full_name?.trim() || user.username?.trim() || user.email.trim() || 'Traveler'
  const role: Exclude<AppRole, 'guest'> = hasAdminAccess(user) ? 'admin' : 'traveler'

  return {
    id: user.id,
    name: displayName,
    email: user.email,
    role,
    avatar: '',
    title: role === 'admin' ? 'Operations Administrator' : 'Account Holder',
    initials: buildInitials(displayName),
    memberId: buildMemberId(user.id, role),
    location: user.nationality?.trim() || (role === 'admin' ? 'Operations Hub' : 'Traveler account'),
  }
}
