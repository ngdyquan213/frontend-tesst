import { useProfileQuery } from '@/features/profile/queries/useProfileQuery'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Card } from '@/shared/ui/Card'

export const ProfileCard = () => {
  const { data, isPending } = useProfileQuery()

  if (isPending) {
    return (
      <Card className="min-h-[170px] text-center">
        <Skeleton className="mx-auto mb-4 h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="mx-auto mt-3 h-4 w-28" />
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="flex min-h-[170px] items-center justify-center text-center">
        <div>
          <h3 className="text-xl font-bold text-primary">Profile unavailable</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Traveler details will appear here once the account profile finishes loading.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="min-h-[170px] text-center">
      <img alt={data.name} className="mx-auto mb-4 h-24 w-24 rounded-full object-cover" src={data.avatar} />
      <h3 className="text-xl font-bold text-primary">{data.name}</h3>
      <p className="text-sm text-on-surface-variant">{data.location}</p>
    </Card>
  )
}
