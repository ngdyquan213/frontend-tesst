import { env } from '@/app/config/env'
import { adminDashboardApi } from '@/features/admin/dashboard/api/adminDashboard.api'
import { createAdminApi } from '@/shared/api/adminApi'
import { apiClient } from '@/shared/api/apiClient'

describe('admin dashboard api', () => {
  it('maps live dashboard summary into active booking and activity cards', async () => {
    const previousEnableMocks = env.enableMocks
    env.enableMocks = false

    const getAdminDashboardSummarySpy = vi
      .spyOn(apiClient, 'getAdminDashboardSummary')
      .mockResolvedValue({
        booking_status_counts: [
          { status: 'pending', count: 3 },
          { status: 'confirmed', count: 5 },
          { status: 'cancelled', count: 2 },
          { status: 'failed', count: 1 },
        ],
        payment_status_counts: [],
        refund_status_counts: [
          { status: 'pending', count: 4 },
          { status: 'processed', count: 2 },
        ],
        revenue: {
          total_paid_amount: 1000,
          total_refunded_amount: 250,
          net_revenue_amount: 750,
          currency: 'USD',
        },
        recent_activities: [
          {
            audit_log_id: 'log-1',
            actor_type: 'admin',
            actor_user_id: 'admin-1',
            action: 'booking_reviewed',
            resource_type: 'booking',
            resource_id: 'booking-1',
            created_at: '2026-04-09T00:00:00.000Z',
          },
          {
            audit_log_id: 'log-2',
            actor_type: 'system',
            actor_user_id: null,
            action: 'refund_processed',
            resource_type: 'refund',
            resource_id: 'refund-1',
            created_at: '2026-04-09T01:00:00.000Z',
          },
        ],
      })

    try {
      await expect(adminDashboardApi.getDashboard()).resolves.toEqual({
        activeBookings: 8,
        pendingRefunds: 4,
        recentActivityCount: 2,
        tasks: [],
      })
    } finally {
      env.enableMocks = previousEnableMocks
      getAdminDashboardSummarySpy.mockRestore()
    }
  })

  it('keeps admin stats usable when the method is called without object binding', async () => {
    const client = {
      get: vi.fn(async (path: string) => {
        if (path === '/admin/dashboard/summary') {
          return {
            data: {
              booking_status_counts: [
                { status: 'pending', count: 2 },
                { status: 'confirmed', count: 3 },
              ],
              payment_status_counts: [],
              refund_status_counts: [{ status: 'pending', count: 1 }],
              revenue: {
                total_paid_amount: 800,
                total_refunded_amount: 100,
                net_revenue_amount: 700,
                currency: 'USD',
              },
              recent_activities: [
                {
                  audit_log_id: 'log-1',
                  actor_type: 'system',
                  actor_user_id: null,
                  action: 'summary_refreshed',
                  resource_type: null,
                  resource_id: null,
                  created_at: '2026-04-09T02:00:00.000Z',
                },
              ],
            },
          }
        }

        if (path === '/admin/users') {
          return {
            data: {
              total: 12,
              users: [],
            },
          }
        }

        throw new Error(`Unexpected admin api path: ${path}`)
      }),
    }

    const { getAdminStats } = createAdminApi(client as never)

    await expect(getAdminStats()).resolves.toEqual({
      total_users: 12,
      total_bookings: 5,
      total_revenue: 700,
      pending_approvals: 1,
      document_queue: 1,
    })
  })
})
