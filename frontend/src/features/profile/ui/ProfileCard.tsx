import { useProfileQuery } from '@/features/profile/queries/useProfileQuery'
import { Card } from '@/shared/ui/Card'

export const ProfileCard = () => {
  const { data } = useProfileQuery()
  return (
    <Card className="text-center">
      <img alt={data?.name} className="mx-auto mb-4 h-24 w-24 rounded-full object-cover" src={data?.avatar} />
      <h3 className="text-xl font-bold text-primary">{data?.name}</h3>
      <p className="text-sm text-on-surface-variant">{data?.location}</p>
    </Card>
  )
}

