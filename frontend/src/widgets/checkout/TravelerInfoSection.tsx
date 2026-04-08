import { useTravelersQuery } from '@/features/travelers/queries/useTravelersQuery'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

export const TravelerInfoSection = () => {
  const { data, isPending } = useTravelersQuery()

  return (
    <Card>
      <h2 className="mb-6 text-2xl font-bold text-primary">Traveler information</h2>
      {isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-4"
            >
              <div className="space-y-3">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((traveler) => (
            <div
              key={traveler.id}
              className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-4"
            >
              <div>
                <div className="font-bold text-primary">{traveler.fullName}</div>
                <div className="text-sm text-on-surface-variant">{traveler.relation}</div>
              </div>
              <span className="material-symbols-outlined text-secondary">check_circle</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No travelers added"
          description="Add at least one traveler before moving into payment so the booking can be issued correctly."
        />
      )}
    </Card>
  )
}
