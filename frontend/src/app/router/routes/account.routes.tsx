import type { RouteObject } from 'react-router-dom'
import { AccountLayout } from '@/app/layouts/AccountLayout'
import { AuthGuard } from '@/app/router/guards/AuthGuard'
import BookingDetailPage from '@/pages/account/BookingDetailPage'
import BookingsPage from '@/pages/account/BookingsPage'
import ChangePasswordPage from '@/pages/account/ChangePasswordPage'
import DashboardPage from '@/pages/account/DashboardPage'
import DocumentDetailPage from '@/pages/account/DocumentDetailPage'
import DocumentsPage from '@/pages/account/DocumentsPage'
import NotificationsPage from '@/pages/account/NotificationsPage'
import ProfilePage from '@/pages/account/ProfilePage'
import RefundDetailPage from '@/pages/account/RefundDetailPage'
import RefundsPage from '@/pages/account/RefundsPage'
import SupportPage from '@/pages/account/SupportPage'
import TravelersPage from '@/pages/account/TravelersPage'
import VouchersPage from '@/pages/account/VouchersPage'

export const accountRoutes: RouteObject[] = [
  {
    path: '/account',
    element: <AuthGuard />,
    children: [
      {
        element: <AccountLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'change-password', element: <ChangePasswordPage /> },
          { path: 'travelers', element: <TravelersPage /> },
          { path: 'bookings', element: <BookingsPage /> },
          { path: 'bookings/:bookingId', element: <BookingDetailPage /> },
          { path: 'vouchers', element: <VouchersPage /> },
          { path: 'documents', element: <DocumentsPage /> },
          { path: 'documents/:documentId', element: <DocumentDetailPage /> },
          { path: 'refunds', element: <RefundsPage /> },
          { path: 'refunds/:refundId', element: <RefundDetailPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'support', element: <SupportPage /> },
        ],
      },
    ],
  },
]

