import type { RouteObject } from 'react-router-dom'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AdminGuard } from '@/app/router/guards/AdminGuard'
import {
  lazyDefaultPage,
  renderLazyPage,
} from '@/app/router/renderLazyPage'

const DashboardPage = lazyDefaultPage(() => import('@/pages/admin/DashboardPage'))
const TourManagementPage = lazyDefaultPage(() => import('@/pages/admin/TourManagementPage'))
const ScheduleManagementPage = lazyDefaultPage(
  () => import('@/pages/admin/ScheduleManagementPage'),
)
const PricingManagementPage = lazyDefaultPage(
  () => import('@/pages/admin/PricingManagementPage'),
)
const BookingManagementPage = lazyDefaultPage(
  () => import('@/pages/admin/BookingManagementPage'),
)
const BookingDetailPage = lazyDefaultPage(() => import('@/pages/admin/BookingDetailPage'))
const RefundManagementPage = lazyDefaultPage(
  () => import('@/pages/admin/RefundManagementPage'),
)
const DocumentManagementPage = lazyDefaultPage(
  () => import('@/pages/admin/DocumentManagementPage'),
)
const OperationsPage = lazyDefaultPage(() => import('@/pages/admin/OperationsPage'))

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: renderLazyPage(DashboardPage) },
          { path: 'tours', element: renderLazyPage(TourManagementPage) },
          { path: 'schedules', element: renderLazyPage(ScheduleManagementPage) },
          { path: 'pricing', element: renderLazyPage(PricingManagementPage) },
          { path: 'bookings', element: renderLazyPage(BookingManagementPage) },
          { path: 'bookings/:bookingId', element: renderLazyPage(BookingDetailPage) },
          { path: 'refunds', element: renderLazyPage(RefundManagementPage) },
          { path: 'documents', element: renderLazyPage(DocumentManagementPage) },
          { path: 'operations', element: renderLazyPage(OperationsPage) },
        ],
      },
    ],
  },
]
