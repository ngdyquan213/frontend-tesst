import { useParams } from 'react-router-dom'
import { useTourDetailQuery } from '@/features/tours/queries/useTourDetailQuery'
import { TourPriceBox } from '@/features/tours/ui/TourPriceBox'
import { LoadingOverlay } from '@/shared/components/LoadingOverlay'
import { TourDetailHero } from '@/widgets/tours/TourDetailHero'
import { DestinationHighlightSection } from '@/widgets/tours/DestinationHighlightSection'
import { TourScheduleSection } from '@/widgets/tours/TourScheduleSection'

const TourDetailPage = () => {
  const { slug = 'amalfi-coast-sailing' } = useParams()
  const { data } = useTourDetailQuery(slug)

  if (!data) return <LoadingOverlay />

  return (
    <div className="page-shell py-10">
      <TourDetailHero tour={data} />
      <div className="grid gap-8 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="space-y-8">
          <DestinationHighlightSection tour={data} />
          <TourScheduleSection tourId={data.id} />
        </div>
        <TourPriceBox tour={data} />
      </div>
    </div>
  )
}

export default TourDetailPage

