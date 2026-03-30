import { PageHeader } from '@/shared/components/PageHeader'
import { DestinationSection } from '@/features/tours/ui/DestinationSection'

const DestinationsPage = () => (
  <div className="page-shell space-y-10 py-12">
    <PageHeader title="Destinations" description="Destination surfaces are now connected to the same tour dataset." />
    <DestinationSection />
  </div>
)

export default DestinationsPage

