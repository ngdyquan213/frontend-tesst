import { EmptyState } from '@/shared/ui/EmptyState'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

interface CheckoutSummarySectionProps {
  destinationLabel?: string
  scheduleLabel?: string
  travelerLabel?: string
  leadTravelerName?: string
  scheduleId?: string
  isLoading?: boolean
}

export const CheckoutSummarySection = ({
  destinationLabel,
  scheduleLabel,
  travelerLabel,
  leadTravelerName,
  scheduleId,
  isLoading = false,
}: CheckoutSummarySectionProps) => {
  if (isLoading) {
    return (
      <Card className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
      </Card>
    )
  }

  if (!destinationLabel || !scheduleLabel) {
    return (
      <EmptyState
        title="No departure selected"
        description="Choose a departure from the tour schedules page before entering checkout."
      />
    )
  }

  return (
    <Card>
      <h2 className="mb-6 text-2xl font-bold text-primary">Review your trip</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-surface-container-low p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Destination
          </div>
          <div className="mt-2 font-semibold text-primary">{destinationLabel}</div>
        </div>
        <div className="rounded-2xl bg-surface-container-low p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Dates
          </div>
          <div className="mt-2 font-semibold text-primary">{scheduleLabel}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-surface-container-low p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Travelers
          </div>
          <div className="mt-2 font-semibold text-primary">{travelerLabel ?? 'Traveler details pending'}</div>
          {leadTravelerName ? (
            <div className="mt-2 text-sm text-on-surface-variant">Lead traveler: {leadTravelerName}</div>
          ) : null}
        </div>
        <div className="rounded-2xl bg-surface-container-low p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Departure Id
          </div>
          <div className="mt-2 font-semibold text-primary">{scheduleId ?? 'Pending selection'}</div>
        </div>
      </div>
    </Card>
  )
}
