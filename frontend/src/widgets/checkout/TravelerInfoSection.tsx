import { Alert } from '@/shared/ui/Alert'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'

interface TravelerInfoSectionProps {
  adultCount: number
  childCount: number
  infantCount: number
  availableSlots?: number
  onTravelerCountChange: (counts: {
    adultCount: number
    childCount: number
    infantCount: number
  }) => void
}

export const TravelerInfoSection = ({
  adultCount,
  childCount,
  infantCount,
  availableSlots,
  onTravelerCountChange,
}: TravelerInfoSectionProps) => {
  const totalTravelers = adultCount + childCount + infantCount

  const updateCount = (
    field: 'adultCount' | 'childCount' | 'infantCount',
    rawValue: string,
  ) => {
    const parsedValue = Number.parseInt(rawValue, 10)
    const nextCounts = {
      adultCount,
      childCount,
      infantCount,
      [field]: Number.isFinite(parsedValue) ? Math.max(0, Math.min(parsedValue, 20)) : 0,
    }

    if (
      availableSlots &&
      nextCounts.adultCount + nextCounts.childCount + nextCounts.infantCount > availableSlots
    ) {
      return
    }

    onTravelerCountChange(nextCounts)
  }

  return (
    <Card>
      <h2 className="mb-6 text-2xl font-bold text-primary">Traveler information</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-primary">Adults</span>
          <Input
            type="number"
            min={1}
            max={20}
            value={adultCount}
            onChange={(event) => updateCount('adultCount', event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-primary">Children</span>
          <Input
            type="number"
            min={0}
            max={20}
            value={childCount}
            onChange={(event) => updateCount('childCount', event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-primary">Infants</span>
          <Input
            type="number"
            min={0}
            max={20}
            value={infantCount}
            onChange={(event) => updateCount('infantCount', event.target.value)}
          />
        </label>
      </div>
      <Alert tone="info">
        This pilot release locks the traveler mix now and collects individual traveler profiles after
        booking confirmation inside the booking workspace.
      </Alert>
      {availableSlots ? (
        <p className="mt-4 text-sm text-on-surface-variant">
          {totalTravelers} of {availableSlots} available traveler slots selected for this departure.
        </p>
      ) : null}
    </Card>
  )
}
