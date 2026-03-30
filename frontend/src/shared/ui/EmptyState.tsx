import { Button } from '@/shared/ui/Button'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState = ({ title, description, actionLabel, onAction }: EmptyStateProps) => (
  <div className="surface-card flex flex-col items-center gap-4 p-10 text-center">
    <div className="rounded-full bg-surface-container p-4">
      <span className="material-symbols-outlined text-primary">travel_explore</span>
    </div>
    <div>
      <h3 className="mb-2 text-xl font-bold text-primary">{title}</h3>
      <p className="text-sm text-on-surface-variant">{description}</p>
    </div>
    {actionLabel ? (
      <Button onClick={onAction} variant="outline">
        {actionLabel}
      </Button>
    ) : null}
  </div>
)

