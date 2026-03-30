import { PageHeader } from '@/shared/components/PageHeader'
import { TourScheduleSection } from '@/widgets/tours/TourScheduleSection'

const ScheduleManagementPage = () => (
  <div className="space-y-10">
    <PageHeader title="Schedule Management" description="Schedule review is now routed inside the admin area." />
    <TourScheduleSection tourId="tour-amalfi" />
  </div>
)

export default ScheduleManagementPage

