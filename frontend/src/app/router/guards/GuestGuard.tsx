import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingOverlay } from '@/shared/components/LoadingOverlay'
import { getDefaultSignedInPath } from '@/shared/lib/auth'

export const GuestGuard = () => {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <LoadingOverlay />
      </div>
    )
  }

  if (!user) return <Outlet />
  return <Navigate replace to={getDefaultSignedInPath(user)} />
}
