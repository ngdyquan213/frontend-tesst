import { useTravelersQuery } from '@/features/travelers/queries/useTravelersQuery'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'

export const TravelerList = () => {
  const { data } = useTravelersQuery()

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No travelers added yet"
        description="Traveler records will appear here once you have an active booking with passenger details attached."
      />
    )
  }

  return (
    <div className="grid gap-4">
      {data?.map((traveler) => (
        <Card key={traveler.id} className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-primary">{traveler.fullName}</h3>
            <p className="text-sm text-on-surface-variant">{traveler.relation}</p>
          </div>
          {traveler.isPrimary ? <span className="text-xs font-bold uppercase tracking-widest text-secondary">Primary</span> : null}
        </Card>
      ))}
    </div>
  )
}
