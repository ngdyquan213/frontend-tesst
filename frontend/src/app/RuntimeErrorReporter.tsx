import { useEffect } from 'react'
import { reportRuntimeError } from '@/shared/monitoring/reportRuntimeError'

export const RuntimeErrorReporter = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportRuntimeError({
        source: 'error',
        message: event.message || 'Unhandled window error',
        stack: event.error instanceof Error ? event.error.stack : undefined,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? event.reason
          : new Error(typeof event.reason === 'string' ? event.reason : 'Unhandled promise rejection')

      reportRuntimeError({
        source: 'unhandledrejection',
        message: reason.message,
        stack: reason.stack,
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
