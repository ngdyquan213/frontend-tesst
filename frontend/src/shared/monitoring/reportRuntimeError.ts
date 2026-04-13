import { env } from '@/app/config/env'

interface RuntimeErrorReport {
  source: 'boundary' | 'error' | 'unhandledrejection'
  message: string
  stack?: string
  metadata?: Record<string, unknown>
}

const REDACTED = '[REDACTED]'
const TRUNCATED = '[TRUNCATED]'
const MAX_TEXT_LENGTH = 500
const MAX_STACK_LINES = 12
const MAX_METADATA_ITEMS = 20
const MAX_METADATA_DEPTH = 3
const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'password',
  'passwd',
  'secret',
  'token',
  'refresh_token',
  'access_token',
  'api_key',
  'apikey',
])
const SENSITIVE_TEXT_PATTERNS = [
  /\bbearer\s+[A-Za-z0-9._~+/-]+=*/gi,
  /\b(authorization|cookie|password|passwd|secret|token|refresh[_-]?token|access[_-]?token|api[_-]?key)\b\s*[:=]\s*([^\s,;]+)/gi,
]

function truncateText(value: string, limit = MAX_TEXT_LENGTH) {
  if (value.length <= limit) {
    return value
  }

  return `${value.slice(0, limit - TRUNCATED.length - 1)} ${TRUNCATED}`
}

function redactText(value: string) {
  return SENSITIVE_TEXT_PATTERNS.reduce((sanitized, pattern) => {
    return sanitized.replace(pattern, (match, key?: string) => (key ? `${key}=${REDACTED}` : REDACTED))
  }, value)
}

function sanitizeText(value?: string, options?: { limit?: number; preserveNewlines?: boolean }) {
  if (!value) {
    return undefined
  }

  const limit = options?.limit ?? MAX_TEXT_LENGTH
  const preserveNewlines = options?.preserveNewlines ?? false
  const sanitized = redactText(value.trim())

  if (!sanitized) {
    return undefined
  }

  if (preserveNewlines) {
    const lines = sanitized
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, MAX_STACK_LINES)

    return truncateText(lines.join('\n'), limit)
  }

  return truncateText(sanitized, limit)
}

function sanitizeMetadata(value: unknown, depth = 0): unknown {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') {
    return value
  }

  if (depth >= MAX_METADATA_DEPTH) {
    return TRUNCATED
  }

  if (typeof value === 'string') {
    return sanitizeText(value, { limit: 160 })
  }

  if (Array.isArray(value)) {
    const sanitizedItems = value.slice(0, MAX_METADATA_ITEMS).map((item) => sanitizeMetadata(item, depth + 1))
    if (value.length > MAX_METADATA_ITEMS) {
      sanitizedItems.push(TRUNCATED)
    }
    return sanitizedItems
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_METADATA_ITEMS)
    const sanitizedEntries = entries.map(([key, item]) => {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        return [key, REDACTED] as const
      }

      return [truncateText(key, 80), sanitizeMetadata(item, depth + 1)] as const
    })

    if (Object.keys(value as Record<string, unknown>).length > MAX_METADATA_ITEMS) {
      sanitizedEntries.push(['truncated', true])
    }

    return Object.fromEntries(sanitizedEntries)
  }

  return Object.prototype.toString.call(value)
}

function buildRuntimeErrorPayload(report: RuntimeErrorReport) {
  return {
    source: report.source,
    message: sanitizeText(report.message) ?? 'Unknown runtime error',
    stack: sanitizeText(report.stack, { limit: 1_200, preserveNewlines: true }),
    metadata:
      report.metadata && Object.keys(report.metadata).length > 0
        ? (sanitizeMetadata(report.metadata) as Record<string, unknown>)
        : undefined,
    route:
      typeof window !== 'undefined'
        ? sanitizeText(`${window.location.pathname}${window.location.search}`, { limit: 300 })
        : undefined,
    userAgent:
      typeof navigator !== 'undefined' ? sanitizeText(navigator.userAgent, { limit: 300 }) : undefined,
  }
}

export function reportRuntimeError(report: RuntimeErrorReport) {
  if (typeof window === 'undefined') {
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
