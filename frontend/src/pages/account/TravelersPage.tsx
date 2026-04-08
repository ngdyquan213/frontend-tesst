import { TravelerList } from '@/features/travelers/ui/TravelerList'
import { PageHeader } from '@/shared/components/PageHeader'
import { Alert } from '@/shared/ui/Alert'

const TravelersPage = () => (
  <div className="space-y-10">
    <PageHeader title="Travelers" description="Traveler records will be managed from each booking once that API is enabled in the account flow." />
    <Alert tone="info">
      The backend currently stores travelers per booking, not as a shared account address book. This screen is kept read-only for now to avoid creating data in the wrong shape.
    </Alert>
    <TravelerList />
  </div>
)

export default TravelersPage
