import type { RouteObject } from 'react-router-dom'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { GuestGuard } from '@/app/router/guards/GuestGuard'
import {
  lazyDefaultPage,
  renderLazyPage,
} from '@/app/router/renderLazyPage'

const LoginPage = lazyDefaultPage(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazyDefaultPage(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazyDefaultPage(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazyDefaultPage(() => import('@/pages/auth/ResetPasswordPage'))

export const authRoutes: RouteObject[] = [
  {
    path: '/auth',
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: renderLazyPage(LoginPage) },
          { path: 'register', element: renderLazyPage(RegisterPage) },
          { path: 'forgot-password', element: renderLazyPage(ForgotPasswordPage) },
          { path: 'reset-password', element: renderLazyPage(ResetPasswordPage) },
          { path: 'reset-password/:token', element: renderLazyPage(ResetPasswordPage) },
        ],
      },
    ],
  },
]
