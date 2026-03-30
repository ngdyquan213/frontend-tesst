import type { RouteObject } from 'react-router-dom'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AdminGuard } from '@/app/router/guards/AdminGuard'
import BookingDetailPage from '@/pages/admin/BookingDetailPage'
import BookingManagementPage from '@/pages/admin/BookingManagementPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import DocumentManagementPage from '@/pages/admin/DocumentManagementPage'
import OperationsPage from '@/pages/admin/OperationsPage'
import PricingManagementPage from '@/pages/admin/PricingManagementPage'
import RefundManagementPage from '@/pages/admin/RefundManagementPage'
import ScheduleManagementPage from '@/pages/admin/ScheduleManagementPage'
import TourManagementPage from '@/pages/admin/TourManagementPage'

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'tours', element: <TourManagementPage /> },
          { path: 'schedules', element: <ScheduleManagementPage /> },
          { path: 'pricing', element: <PricingManagementPage /> },
          { path: 'bookings', element: <BookingManagementPage /> },
          { path: 'bookings/:bookingId', element: <BookingDetailPage /> },
          { path: 'refunds', element: <RefundManagementPage /> },
          { path: 'documents', element: <DocumentManagementPage /> },
          { path: 'operations', element: <OperationsPage /> },
        ],
      },
    ],
  },
]

