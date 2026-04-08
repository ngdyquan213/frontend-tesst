import { PaymentSummary } from '@/features/payments/ui/PaymentSummary'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

interface PaymentSummarySectionProps {
  amount: number
  tourName?: string
  scheduleLabel?: string
  travelerLabel?: string
  isLoading?: boolean
}

export const PaymentSummarySection = ({
  amount,
  tourName,
  scheduleLabel,
  travelerLabel,
  isLoading = false,
}: PaymentSummarySectionProps) => {
  if (isLoading) {
    return (
      <Card className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <PaymentSummary amount={amount} />
      <Card className="space-y-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Trip
          </div>
          <div className="mt-2 font-semibold text-primary">{tourName ?? 'TravelBook itinerary'}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Schedule
          </div>
          <div className="mt-2 text-sm text-on-surface-variant">{scheduleLabel ?? 'Pending selection'}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Travelers
          </div>
          <div className="mt-2 text-sm text-on-surface-variant">{travelerLabel ?? 'Traveler data pending'}</div>
        </div>
      </Card>
    </div>
  )
}
