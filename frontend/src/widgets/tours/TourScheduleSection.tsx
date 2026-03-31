import { useTourSchedulesQuery } from '@/features/tours/queries/useTourSchedulesQuery'
import { TourScheduleList } from '@/features/tours/ui/TourScheduleList'
import { SectionHeader } from '@/shared/components/SectionHeader'

export const TourScheduleSection = ({ tourId }: { tourId: string }) => {
  const { data } = useTourSchedulesQuery(tourId)
  return (
    <section>
      <SectionHeader
        title="Available departures"
        subtitle="Schedule logic is now connected to checkout and booking flows."
      />
      <TourScheduleList schedules={data ?? []} />
    </section>
  )
}
