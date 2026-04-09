import { apiClient } from '@/shared/api/apiClient'
import { resolveMockable } from '@/shared/api/mockApi'

function humanizeAction(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function inferPriority(action: string) {
  const normalized = action.toLowerCase()

  if (normalized.includes('refund') || normalized.includes('cancel') || normalized.includes('fail')) {
    return 'high' as const
  }

  if (normalized.includes('payment') || normalized.includes('document') || normalized.includes('tour')) {
    return 'medium' as const
  }

  return 'low' as const
}

export const adminOperationsApi = {
  getOperations: async () =>
    resolveMockable({
      mock: ({ adminTasks }) => adminTasks,
      live: async () => {
        const summary = await apiClient.getAdminDashboardSummary(12)
        const recentActivities = summary.recent_activities

        return recentActivities.map((activity) => {
          const action = String(activity.action ?? 'activity')
          const resourceType = String(activity.resource_type ?? 'system')
          const resourceId = typeof activity.resource_id === 'string' ? activity.resource_id : 'n/a'
          const createdAt = String(activity.created_at ?? '')

          return {
            id: String(activity.audit_log_id ?? `${action}-${resourceId}`),
            title: humanizeAction(action),
            summary: `${resourceType} • ${resourceId} • ${new Date(createdAt).toLocaleString()}`,
            priority: inferPriority(action),
            cta: 'Review activity',
          }
        })
      },
    }),
}
