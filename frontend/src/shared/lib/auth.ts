import type { User } from '@/shared/types/api'
import { ROUTES } from '@/shared/constants/routes'
import type { AppRole, AppUser } from '@/shared/types/common'

const ADMIN_ROLES = new Set(['admin', 'super_admin'])
const ADMIN_PERMISSION_PREFIX = 'admin.'

type AuthLikeUser =
  | Pick<User, 'role' | 'roles' | 'permissions'>
  | Pick<AppUser, 'role' | 'roles' | 'permissions'>

function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? ''
}

function normalizePermission(permission?: string | null) {
  return permission?.trim().toLowerCase() ?? ''
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

function getNormalizedRoles(user?: AuthLikeUser | null) {
  if (!user) {
    return []
  }

  return Array.from(
    new Set(
      [user.role, ...(user.roles ?? [])]
        .map((role) => normalizeRole(role))
        .filter(Boolean),
    ),
  )
}

function getNormalizedPermissions(user?: AuthLikeUser | null) {
  if (!user) {
    return []
  }

  return Array.from(
    new Set((user.permissions ?? []).map((permission) => normalizePermission(permission)).filter(Boolean)),
  )
}

function permissionMatches(grantedPermission: string, requiredPermission: string) {
  if (grantedPermission === '*' || grantedPermission === requiredPermission) {
    return true
  }

  if (grantedPermission === 'admin:*' && requiredPermission.startsWith(ADMIN_PERMISSION_PREFIX)) {
    return true
  }

  if (!grantedPermission.endsWith('.*')) {
    return false
  }

  const prefix = grantedPermission.slice(0, -2)
  return requiredPermission === prefix || requiredPermission.startsWith(`${prefix}.`)
}

export function hasAdminAccess(user?: AuthLikeUser | null) {
  if (!user) {
    return false
  }

  return (
    getNormalizedRoles(user).some((role) => ADMIN_ROLES.has(role)) ||
    getNormalizedPermissions(user).some(
      (permission) =>
        permission === 'admin:*' || permission === 'admin' || permission.startsWith(ADMIN_PERMISSION_PREFIX),
    )
  )
}

export function hasPermission(user: AuthLikeUser | null | undefined, permission: string) {
  const requiredPermission = normalizePermission(permission)

  if (!user || !requiredPermission) {
    return false
  }

  const permissions = getNormalizedPermissions(user)
  if (permissions.some((grantedPermission) => permissionMatches(grantedPermission, requiredPermission))) {
    return true
  }

  return permissions.length === 0 && hasAdminAccess(user) && requiredPermission.startsWith(ADMIN_PERMISSION_PREFIX)
}

export function hasAnyPermission(user: AuthLikeUser | null | undefined, permissions: readonly string[]) {
  return permissions.some((permission) => hasPermission(user, permission))
}

export function getDefaultSignedInPath(user: AuthLikeUser | Pick<AppUser, 'role' | 'roles' | 'permissions'>) {
  return hasAdminAccess(user) ? ROUTES.adminDashboard : ROUTES.accountDashboard
}

export function mapApiUserToAppUser(user: User): AppUser {
  const displayName =
    user.name?.trim() || user.full_name?.trim() || user.username?.trim() || user.email.trim() || 'Traveler'
  const roles = getNormalizedRoles(user)
  const permissions = getNormalizedPermissions(user)
  const role: Exclude<AppRole, 'guest'> = hasAdminAccess(user) ? 'admin' : 'traveler'

  return {
    id: user.id,
    name: displayName,
    email: user.email,
    emailVerified: Boolean(user.email_verified),
    role,
    roles,
    permissions,
    avatar: '',
    title: role === 'admin' ? 'Operations Administrator' : 'Account Holder',
    initials: buildInitials(displayName),
    memberId: buildMemberId(user.id, role),
    location: user.nationality?.trim() || (role === 'admin' ? 'Operations Hub' : 'Traveler account'),
  }
}
