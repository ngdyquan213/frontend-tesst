import { env } from '@/app/config/env'
import { apiClient, resolveAfter } from '@/shared/api/apiClient'
import { adminTasks } from '@/shared/api/mockData'

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
  getOperations: async () => {
    if (env.enableMocks) {
      return resolveAfter(adminTasks)
    }

    const summary = await apiClient.getAdminDashboardSummary(12)
    const recentActivities = Array.isArray(summary.recent_activities)
      ? summary.recent_activities.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      : []

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
}
