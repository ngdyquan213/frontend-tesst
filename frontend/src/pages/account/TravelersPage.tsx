import { PageHeader } from '@/shared/components/PageHeader'
import { TravelerForm } from '@/features/travelers/ui/TravelerForm'
import { TravelerList } from '@/features/travelers/ui/TravelerList'

const TravelersPage = () => (
  <div className="space-y-10">
    <PageHeader title="Travelers" description="Manage everyone included in future bookings." />
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <TravelerForm />
      <TravelerList />
    </div>
  </div>
)

export default TravelersPage

