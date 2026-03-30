import { useTravelersQuery } from '@/features/travelers/queries/useTravelersQuery'
import { Card } from '@/shared/ui/Card'

export const TravelerList = () => {
  const { data } = useTravelersQuery()
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

