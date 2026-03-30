import { EmptyState } from '@/shared/ui/EmptyState'

export const ErrorFallback = ({ message }: { message?: string }) => (
  <EmptyState
    title="Something went wrong"
    description={message ?? 'The page could not be loaded right now.'}
  />
)

