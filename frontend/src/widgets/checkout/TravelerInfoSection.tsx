import { useTravelersQuery } from '@/features/travelers/queries/useTravelersQuery'
import { Card } from '@/shared/ui/Card'

export const TravelerInfoSection = () => {
  const { data } = useTravelersQuery()
  return (
    <Card>
      <h2 className="mb-6 text-2xl font-bold text-primary">Traveler information</h2>
      <div className="space-y-4">
        {data?.map((traveler) => (
          <div key={traveler.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-4">
            <div>
              <div className="font-bold text-primary">{traveler.fullName}</div>
              <div className="text-sm text-on-surface-variant">{traveler.relation}</div>
            </div>
            <span className="material-symbols-outlined text-secondary">check_circle</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

