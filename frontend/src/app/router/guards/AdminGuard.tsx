import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingOverlay } from '@/shared/components/LoadingOverlay'

export const AdminGuard = () => {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <LoadingOverlay />
      </div>
    )
  }

  if (!user) return <Navigate replace to="/auth/login" />
  if (user.role !== 'admin') return <Navigate replace to="/403" />
  return <Outlet />
}
