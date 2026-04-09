import { env } from '@/app/config/env'
import { isMockApiEnabled } from '@/shared/api/mockMode'

interface RuntimeErrorReport {
  source: 'boundary' | 'error' | 'unhandledrejection'
  message: string
  stack?: string
  metadata?: Record<string, unknown>
}

function buildRuntimeErrorPayload(report: RuntimeErrorReport) {
  return {
    ...report,
    route:
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  }
}

export function reportRuntimeError(report: RuntimeErrorReport) {
  if (isMockApiEnabled() || typeof window === 'undefined') {
    return
  }

  const payload = buildRuntimeErrorPayload(report)
  const body = JSON.stringify(payload)
  const endpoint = `${env.apiBaseUrl}/client-events/runtime-errors`

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon(endpoint, blob)) {
        return
      }
    }
  } catch {
    // Fall back to fetch below if beacon transport is unavailable.
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
    credentials: 'include',
  }).catch(() => undefined)
}
