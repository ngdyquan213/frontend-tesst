import type { AxiosInstance } from 'axios'
import {
  normalizeBooking,
  normalizeDocument,
  normalizePaginatedItems,
  normalizeRecordArray,
  normalizeRefund,
  normalizeTour,
  toNumber,
} from '@/shared/api/apiNormalizers'
import type * as types from '@/shared/types/api'

function normalizeStatusCounts(items: unknown): types.AdminDashboardStatusCount[] {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      status: String(item.status ?? ''),
      count: toNumber(item.count),
    }))
}

function normalizeRecentActivities(items: unknown): types.AdminDashboardRecentActivity[] {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      audit_log_id: String(item.audit_log_id ?? ''),
      actor_type: String(item.actor_type ?? 'system'),
      actor_user_id: typeof item.actor_user_id === 'string' ? item.actor_user_id : null,
      action: String(item.action ?? ''),
      resource_type: typeof item.resource_type === 'string' ? item.resource_type : null,
      resource_id: typeof item.resource_id === 'string' ? item.resource_id : null,
      created_at: String(item.created_at ?? new Date().toISOString()),
    }))
}

function normalizeAdminDashboardSummary(data: Record<string, unknown>): types.AdminDashboardSummary {
  const revenueRaw =
    data.revenue && typeof data.revenue === 'object'
      ? (data.revenue as Record<string, unknown>)
      : {}

  return {
    booking_status_counts: normalizeStatusCounts(data.booking_status_counts),
    payment_status_counts: normalizeStatusCounts(data.payment_status_counts),
    refund_status_counts: normalizeStatusCounts(data.refund_status_counts),
    revenue: {
      total_paid_amount: toNumber(revenueRaw.total_paid_amount),
      total_refunded_amount: toNumber(revenueRaw.total_refunded_amount),
      net_revenue_amount: toNumber(
        revenueRaw.net_revenue_amount ?? revenueRaw.total_paid_amount,
      ),
      currency: String(revenueRaw.currency ?? 'USD'),
    },
    recent_activities: normalizeRecentActivities(data.recent_activities),
  }
}

function normalizeAdminUser(raw: Record<string, unknown>): types.AdminUser {
  const roles = Array.isArray(raw.roles)
    ? raw.roles.filter((item): item is string => typeof item === 'string')
    : []

  return {
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.full_name ?? raw.name ?? raw.username ?? raw.email ?? 'User'),
    is_admin: roles.includes('admin') || String(raw.role ?? '').toLowerCase() === 'admin',
    created_at: String(raw.created_at ?? new Date().toISOString()),
  }
}

function countStatuses(
  items: types.AdminDashboardStatusCount[],
  matcher: (status: string) => boolean,
) {
  return items.reduce(
    (sum, item) => (matcher(item.status.toLowerCase()) ? sum + item.count : sum),
    0,
  )
}

export function createAdminApi(client: AxiosInstance) {
  const getAdminDashboardSummary = async (
    recentLimit = 10,
  ): Promise<types.AdminDashboardSummary> => {
    const response = await client.get('/admin/dashboard/summary', {
      params: { recent_limit: recentLimit },
    })

    return normalizeAdminDashboardSummary(
      response.data as Record<string, unknown>,
    )
  }

  return {
    async getAdminStats(): Promise<types.AdminStats> {
      const [summary, usersResponse] = await Promise.all([
        getAdminDashboardSummary(),
        client.get('/admin/users', {
          params: { page: 1, page_size: 1 },
        }),
      ])

      return {
        total_users: toNumber(usersResponse.data?.total),
        total_bookings: summary.booking_status_counts.reduce(
          (sum, item) => sum + item.count,
          0,
        ),
        total_revenue: summary.revenue.net_revenue_amount,
        pending_approvals: countStatuses(
          summary.refund_status_counts,
          (status) => status === 'pending',
        ),
        document_queue: summary.recent_activities.length,
      }
    },

    getAdminDashboardSummary,

    async getAllUsers(limit = 10, offset = 0): Promise<{ users: types.AdminUser[]; total: number }> {
      const response = await client.get('/admin/users', {
        params: { page: Math.floor(offset / limit) + 1, page_size: limit },
      })
      return {
        users: normalizePaginatedItems(response.data, 'users', normalizeAdminUser),
        total: toNumber(response.data.total),
      }
    },

    async getAllBookings(limit = 10, offset = 0): Promise<{ bookings: types.Booking[]; total: number }> {
      const response = await client.get('/admin/bookings', {
        params: { page: Math.floor(offset / limit) + 1, page_size: limit },
      })
      return {
        bookings: normalizePaginatedItems(response.data, 'bookings', normalizeBooking),
        total: toNumber(response.data.total),
      }
    },

    async getAdminRefunds(limit = 20, offset = 0): Promise<{ refunds: types.Refund[]; total: number }> {
      const response = await client.get('/admin/refunds', {
        params: { page: Math.floor(offset / limit) + 1, page_size: limit },
      })

      return {
        refunds: normalizeRecordArray(response.data, 'refunds', normalizeRefund),
        total:
          response.data && typeof response.data === 'object' && 'total' in response.data
            ? toNumber((response.data as Record<string, unknown>).total)
            : 0,
      }
    },

    async approveRefund(id: string): Promise<types.Refund> {
      const response = await client.put(`/admin/refunds/${id}`, {
        status: 'processed',
        reason: 'Approved from admin dashboard',
      })
      return normalizeRefund(response.data)
    },

    async getAdminTours(limit = 50, offset = 0): Promise<{ tours: types.Tour[]; total: number }> {
      const response = await client.get('/admin/tours', {
        params: { page: Math.floor(offset / limit) + 1, page_size: limit },
      })

      return {
        tours: normalizePaginatedItems(response.data, 'tours', normalizeTour),
        total: toNumber(response.data.total),
      }
    },

    async createAdminTour(payload: {
      code: string
      name: string
      destination: string
      description?: string
      duration_days: number
      duration_nights: number
      meeting_point?: string
      tour_type?: string
      status: 'active' | 'inactive'
    }): Promise<types.Tour> {
      const response = await client.post('/admin/tours', payload)
      return normalizeTour(response.data)
    },

    async updateAdminTour(
      tourId: string,
      payload: {
        name?: string
        destination?: string
        description?: string
        duration_days?: number
        duration_nights?: number
        meeting_point?: string
        tour_type?: string
        status?: 'active' | 'inactive'
      },
    ): Promise<types.Tour> {
      const response = await client.put(`/admin/tours/${tourId}`, payload)
      return normalizeTour(response.data)
    },

    async getAdminCoupons(limit = 50, offset = 0): Promise<{ coupons: Record<string, unknown>[]; total: number }> {
      const response = await client.get('/admin/coupons', {
        params: { page: Math.floor(offset / limit) + 1, page_size: limit },
      })

      return {
        coupons: normalizePaginatedItems(response.data, 'coupons', (item) => item),
        total: toNumber(response.data.total),
      }
    },

    async updateAdminCoupon(
      couponId: string,
      payload: {
        name?: string
        discount_value?: number
        is_active?: boolean
      },
    ): Promise<Record<string, unknown>> {
      const response = await client.put(`/admin/coupons/${couponId}`, payload)
      return response.data as Record<string, unknown>
    },

    async getAdminDocuments(): Promise<types.Document[]> {
      const response = await client.get('/admin/documents')
      return normalizeRecordArray(response.data, 'documents', normalizeDocument)
    },

    async reviewAdminDocument(
      documentId: string,
      status: 'approved' | 'rejected' = 'approved',
    ): Promise<types.Document> {
      const response = await client.post(`/admin/documents/${documentId}/review`, { status })
      return normalizeDocument(response.data)
    },

    async approvePendingDocuments(): Promise<void> {
      throw new Error('Admin document approval is not supported by the current API.')
    },
  }
}
