import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'

export const GuestGuard = () => {
  const { user } = useAuth()
  if (!user) return <Outlet />
  return <Navigate replace to={user.role === 'admin' ? '/admin' : '/account'} />
}

