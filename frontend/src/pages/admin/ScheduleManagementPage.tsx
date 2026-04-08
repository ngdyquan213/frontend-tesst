import { env } from '@/app/config/env'
import { useTourCatalogQuery } from '@/features/tours/queries/useToursQuery'
import { useTourSchedulesQuery } from '@/features/tours/queries/useTourSchedulesQuery'
import { PageHeader } from '@/shared/components/PageHeader'
import { TourScheduleSection } from '@/widgets/tours/TourScheduleSection'

const DEFAULT_ADMIN_TOUR_ID = 'amalfi-coast-sailing'

const ScheduleManagementPage = () => {
  const catalogQuery = useTourCatalogQuery({ limit: 1 })
  const selectedTourId = env.enableMocks ? DEFAULT_ADMIN_TOUR_ID : catalogQuery.data?.[0]?.id
  const schedulesQuery = useTourSchedulesQuery(selectedTourId)
  const isLoading = (!env.enableMocks && catalogQuery.isPending) || schedulesQuery.isPending
  const isError = (!env.enableMocks && catalogQuery.isError) || schedulesQuery.isError
  const errorMessage = catalogQuery.error?.message || schedulesQuery.error?.message

  return (
    <div className="space-y-10">
      <PageHeader title="Schedule Management" description="Schedule review is now routed inside the admin area." />
      <TourScheduleSection
        tourId={selectedTourId ?? DEFAULT_ADMIN_TOUR_ID}
        schedules={schedulesQuery.data?.schedules ?? []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        onRetry={() => void schedulesQuery.refetch()}
        isSchedulesRoute
      />
    </div>
  )
}

export default ScheduleManagementPage
