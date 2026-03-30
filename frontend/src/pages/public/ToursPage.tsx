import { PageHeader } from '@/shared/components/PageHeader'
import { TourCatalogSection } from '@/widgets/tours/TourCatalogSection'

const ToursPage = () => (
  <div className="page-shell space-y-10 py-12">
    <PageHeader
      description="Reliable itineraries designed for practical planning and clear decision-making."
      title="Find Your Next Tour"
    />
    <TourCatalogSection />
  </div>
)

export default ToursPage

