export const ADMIN_PERMISSIONS = {
  usersRead: 'admin.users.read',
  bookingsRead: 'admin.bookings.read',
  paymentsRead: 'admin.payments.read',
  auditLogsRead: 'admin.audit_logs.read',
  couponsRead: 'admin.coupons.read',
  couponsWrite: 'admin.coupons.write',
  documentsRead: 'admin.documents.read',
  documentsWrite: 'admin.documents.write',
  refundsRead: 'admin.refunds.read',
  refundsWrite: 'admin.refunds.write',
  toursRead: 'admin.tours.read',
  toursWrite: 'admin.tours.write',
  dashboardRead: 'admin.dashboard.read',
  exportsRead: 'admin.exports.read',
  supportRead: 'admin.support.read',
  supportWrite: 'admin.support.write',
} as const

export const ADMIN_DASHBOARD_ROUTE_PERMISSIONS = [
  ADMIN_PERMISSIONS.dashboardRead,
  ADMIN_PERMISSIONS.bookingsRead,
  ADMIN_PERMISSIONS.refundsRead,
  ADMIN_PERMISSIONS.supportRead,
] as const

export const ADMIN_NAV_ROUTE_PERMISSIONS = {
  dashboard: [...ADMIN_DASHBOARD_ROUTE_PERMISSIONS],
  tours: [ADMIN_PERMISSIONS.toursRead],
  schedules: [ADMIN_PERMISSIONS.toursRead],
  pricing: [ADMIN_PERMISSIONS.couponsRead],
  bookings: [ADMIN_PERMISSIONS.bookingsRead],
  bookingDetail: [ADMIN_PERMISSIONS.bookingsRead],
  refunds: [ADMIN_PERMISSIONS.refundsRead],
  documents: [ADMIN_PERMISSIONS.documentsRead],
  operations: [ADMIN_PERMISSIONS.supportRead],
} as const
