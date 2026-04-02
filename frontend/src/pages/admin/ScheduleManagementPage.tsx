import { useTourSchedulesQuery } from '@/features/tours/queries/useTourSchedulesQuery'
import { PageHeader } from '@/shared/components/PageHeader'
import { TourScheduleSection } from '@/widgets/tours/TourScheduleSection'

const DEFAULT_ADMIN_TOUR_ID = 'amalfi-coast-sailing'

const ScheduleManagementPage = () => {
  const schedulesQuery = useTourSchedulesQuery(DEFAULT_ADMIN_TOUR_ID)

  return (
    <div className="space-y-10">
      <PageHeader title="Schedule Management" description="Schedule review is now routed inside the admin area." />
      <TourScheduleSection
        schedules={schedulesQuery.data?.schedules ?? []}
        isLoading={schedulesQuery.isPending}
        isError={schedulesQuery.isError}
        errorMessage={schedulesQuery.error?.message}
        onRetry={() => void schedulesQuery.refetch()}
        isSchedulesRoute
      />
    </div>
  )
}

export default ScheduleManagementPage
