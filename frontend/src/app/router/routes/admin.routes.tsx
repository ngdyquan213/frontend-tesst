import type { RouteObject } from 'react-router-dom'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AdminGuard } from '@/app/router/guards/AdminGuard'
import {
  lazyDefaultPage,
  renderLazyPage,
} from '@/app/router/renderLazyPage'
import { ADMIN_NAV_ROUTE_PERMISSIONS } from '@/shared/constants/permissions'

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
          {
            index: true,
            element: (
              <AdminGuard requiredPermissions={ADMIN_NAV_ROUTE_PERMISSIONS.dashboard}>
                {renderLazyPage(DashboardPage)}
              </AdminGuard>
            ),
          },
          {
            path: 'tours',
            element: (
              <AdminGuard requiredPermissions={ADMIN_NAV_ROUTE_PERMISSIONS.tours}>
                {renderLazyPage(TourManagementPage)}
              </AdminGuard>
            ),
          },
          {
            path: 'schedules',
            element: (
              <AdminGuard requiredPermissions={ADMIN_NAV_ROUTE_PERMISSIONS.schedules}>
                {renderLazyPage(ScheduleManagementPage)}
              </AdminGuard>
            ),
          },
          {
            path: 'pricing',
            element: (
              <AdminGuard requiredPermissions={ADMIN_NAV_ROUTE_PERMISSIONS.pricing}>
                {renderLazyPage(PricingManagementPage)}
              </AdminGuard>
            ),
          },
          {
            path: 'bookings',
            element: (
              <AdminGuard requiredPermissions={ADMIN_NAV_ROUTE_PERMISSIONS.bookings}>
                {renderLazyPage(BookingManagementPage)}
              </AdminGuard>
            ),
          },
          {
            path: 'bookings/:bookingId',
            element: (
              <AdminGuard requiredPermissions={ADMIN_NAV_ROUTE_PERMISSIONS.bookingDetail}>
                {renderLazyPage(BookingDetailPage)}
              </AdminGuard>
            ),
          },
          {
            path: 'refunds',
            element: (
              <AdminGuard requiredPermissions={ADMIN_NAV_ROUTE_PERMISSIONS.refunds}>
                {renderLazyPage(RefundManagementPage)}
              </AdminGuard>
            ),
          },
          {
            path: 'documents',
            element: (
              <AdminGuard requiredPermissions={ADMIN_NAV_ROUTE_PERMISSIONS.documents}>
                {renderLazyPage(DocumentManagementPage)}
              </AdminGuard>
            ),
          },
          {
            path: 'operations',
            element: (
              <AdminGuard requiredPermissions={ADMIN_NAV_ROUTE_PERMISSIONS.operations}>
                {renderLazyPage(OperationsPage)}
              </AdminGuard>
            ),
          },
        ],
      },
    ],
  },
]
