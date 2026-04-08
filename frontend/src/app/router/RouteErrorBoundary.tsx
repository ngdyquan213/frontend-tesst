import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { ROUTES } from '@/shared/constants/routes'
import { EmptyState } from '@/shared/ui/EmptyState'

function getRouteErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    if (typeof error.data === 'string' && error.data.trim().length > 0) {
      return error.data
    }

    return error.statusText || 'The requested page could not be rendered right now.'
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return 'The requested page could not be rendered right now.'
}

export const RouteErrorBoundary = () => {
  const error = useRouteError()
  const message = getRouteErrorMessage(error)

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-16">
      <div className="w-full space-y-6">
        <EmptyState title="Something went wrong" description={message} />
        <div className="flex justify-center gap-3">
          <Link
            className="inline-flex items-center justify-center rounded-xl bg-[color:var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"
            to={ROUTES.home}
          >
            Back home
          </Link>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload page
          </Button>
        </div>
      </div>
    </div>
  )
}
