import type { RouteObject } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { GuestGuard } from '@/app/router/guards/GuestGuard'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

export const authRoutes: RouteObject[] = [
  {
    path: '/auth',
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
]

