import type { RouteObject } from 'react-router-dom'
import { AccountLayout } from '@/app/layouts/AccountLayout'
import { AuthGuard } from '@/app/router/guards/AuthGuard'
import {
  lazyDefaultPage,
  renderLazyPage,
} from '@/app/router/renderLazyPage'

const DashboardPage = lazyDefaultPage(() => import('@/pages/account/DashboardPage'))
const ProfilePage = lazyDefaultPage(() => import('@/pages/account/ProfilePage'))
const ChangePasswordPage = lazyDefaultPage(() => import('@/pages/account/ChangePasswordPage'))
const TravelersPage = lazyDefaultPage(() => import('@/pages/account/TravelersPage'))
const BookingsPage = lazyDefaultPage(() => import('@/pages/account/BookingsPage'))
const BookingDetailPage = lazyDefaultPage(() => import('@/pages/account/BookingDetailPage'))
const VouchersPage = lazyDefaultPage(() => import('@/pages/account/VouchersPage'))
const DocumentsPage = lazyDefaultPage(() => import('@/pages/account/DocumentsPage'))
const DocumentDetailPage = lazyDefaultPage(() => import('@/pages/account/DocumentDetailPage'))
const RefundsPage = lazyDefaultPage(() => import('@/pages/account/RefundsPage'))
const RefundDetailPage = lazyDefaultPage(() => import('@/pages/account/RefundDetailPage'))
const NotificationsPage = lazyDefaultPage(() => import('@/pages/account/NotificationsPage'))
const SupportPage = lazyDefaultPage(() => import('@/pages/account/SupportPage'))

export const accountRoutes: RouteObject[] = [
  {
    path: '/account',
    element: <AuthGuard />,
    children: [
      {
        element: <AccountLayout />,
        children: [
          { index: true, element: renderLazyPage(DashboardPage) },
          { path: 'profile', element: renderLazyPage(ProfilePage) },
          { path: 'change-password', element: renderLazyPage(ChangePasswordPage) },
          { path: 'travelers', element: renderLazyPage(TravelersPage) },
          { path: 'bookings', element: renderLazyPage(BookingsPage) },
          { path: 'bookings/:bookingId', element: renderLazyPage(BookingDetailPage) },
          { path: 'vouchers', element: renderLazyPage(VouchersPage) },
          { path: 'documents', element: renderLazyPage(DocumentsPage) },
          { path: 'documents/:documentId', element: renderLazyPage(DocumentDetailPage) },
          { path: 'refunds', element: renderLazyPage(RefundsPage) },
          { path: 'refunds/:refundId', element: renderLazyPage(RefundDetailPage) },
          { path: 'notifications', element: renderLazyPage(NotificationsPage) },
          { path: 'support', element: renderLazyPage(SupportPage) },
        ],
      },
    ],
  },
]
