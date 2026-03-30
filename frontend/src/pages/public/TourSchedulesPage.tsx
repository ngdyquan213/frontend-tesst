import { useParams } from 'react-router-dom'
import { useTourDetailQuery } from '@/features/tours/queries/useTourDetailQuery'
import { PageHeader } from '@/shared/components/PageHeader'
import { TourScheduleSection } from '@/widgets/tours/TourScheduleSection'

const TourSchedulesPage = () => {
  const { slug = 'amalfi-coast-sailing' } = useParams()
  const { data } = useTourDetailQuery(slug)

  if (!data) return null

  return (
    <div className="page-shell space-y-10 py-12">
      <PageHeader description={`Available departures for ${data.title}.`} title="Tour schedules" />
      <TourScheduleSection tourId={data.id} />
    </div>
  )
}

export default TourSchedulesPage

