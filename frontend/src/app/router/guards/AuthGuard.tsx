import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingOverlay } from '@/shared/components/LoadingOverlay'

export const AuthGuard = () => {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <LoadingOverlay />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/auth/login" />
  }

  return <Outlet />
}
