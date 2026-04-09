import type { PropsWithChildren } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingOverlay } from '@/shared/components/LoadingOverlay'
import { hasAdminAccess, hasAnyPermission } from '@/shared/lib/auth'

interface AdminGuardProps extends PropsWithChildren {
  requiredPermissions?: readonly string[]
}

export const AdminGuard = ({ children, requiredPermissions }: AdminGuardProps) => {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <LoadingOverlay />
      </div>
    )
  }

  if (!user) return <Navigate replace to="/auth/login" />
  if (!hasAdminAccess(user)) return <Navigate replace to="/403" />
  if (requiredPermissions?.length && !hasAnyPermission(user, requiredPermissions)) {
    return <Navigate replace to="/403" />
  }

  return children ?? <Outlet />
}
