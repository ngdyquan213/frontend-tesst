import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'

export const AdminGuard = () => {
  const { user } = useAuth()
  if (!user) return <Navigate replace to="/auth/login" />
  if (user.role !== 'admin') return <Navigate replace to="/403" />
  return <Outlet />
}

