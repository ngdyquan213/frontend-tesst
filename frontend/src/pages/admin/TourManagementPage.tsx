import { TourFormDrawer } from '@/features/admin/tours/ui/TourFormDrawer'
import { TourManagementTable } from '@/features/admin/tours/ui/TourManagementTable'
import { PageHeader } from '@/shared/components/PageHeader'

const TourManagementPage = () => (
  <div className="space-y-10">
    <PageHeader title="Tour Management" description="Tour inventory now lives inside a real admin shell." />
    <TourManagementTable />
    <TourFormDrawer />
  </div>
)

export default TourManagementPage

