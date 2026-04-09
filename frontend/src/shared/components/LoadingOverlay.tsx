import { Spinner } from '@/shared/ui/Spinner'

export const LoadingOverlay = () => (
  <div
    className="flex min-h-[40vh] items-center justify-center rounded-3xl bg-white/70 p-10"
    role="status"
    aria-live="polite"
    aria-label="Loading content"
  >
    <Spinner />
    <span className="sr-only">Loading content</span>
  </div>
)
