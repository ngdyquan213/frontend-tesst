import { TravelerList } from '@/features/travelers/ui/TravelerList'
import { PageHeader } from '@/shared/components/PageHeader'
import { Alert } from '@/shared/ui/Alert'

const TravelersPage = () => (
  <div className="space-y-10">
    <PageHeader
      title="Travelers"
      description="Review the traveler records already attached to your confirmed bookings from one account view."
    />
    <Alert tone="info">
      This directory is synced from your booking details, so the names and passport data shown here always reflect the active traveler list on each reservation.
    </Alert>
    <TravelerList />
  </div>
)

export default TravelersPage
