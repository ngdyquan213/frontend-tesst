import { Link, useParams } from 'react-router-dom'
import { routePaths } from '@/app/router/routePaths'
import { useTourDetailQuery } from '@/features/tours/queries/useTourDetailQuery'
import { Card } from '@/shared/ui/Card'
import { PageHeader } from '@/shared/components/PageHeader'
import { TourScheduleSection } from '@/widgets/tours/TourScheduleSection'

const TourSchedulesPage = () => {
  const { id } = useParams()
  const detailQuery = useTourDetailQuery(id)
  const { data } = detailQuery

  if (!id) {
    return (
      <div className="page-shell space-y-10 py-12">
        <PageHeader
          title="Tour schedules"
          description="Select a valid tour before browsing departure schedules."
        />
        <Card className="rounded-[2rem] p-8">
          <p className="text-lg font-bold text-[color:var(--color-primary)]">Missing tour id</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            We could not determine which itinerary you want to view schedules for.
          </p>
          <div className="mt-6">
            <Link
              to={routePaths.public.tours}
              className="inline-flex rounded-2xl border border-[color:var(--color-outline-variant)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition-all hover:bg-[color:var(--color-surface-low)]"
            >
              Back to Tours
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!detailQuery.isPending && !detailQuery.isError && !data) {
    return (
      <div className="page-shell space-y-10 py-12">
        <PageHeader
          title="Tour schedules"
          description="This itinerary is no longer available in the current catalog."
        />
        <Card className="rounded-[2rem] p-8">
          <p className="text-lg font-bold text-[color:var(--color-primary)]">Tour not found</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            Try returning to the catalog and selecting another published departure.
          </p>
          <div className="mt-6">
            <Link
              to={routePaths.public.tours}
              className="inline-flex rounded-2xl border border-[color:var(--color-outline-variant)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition-all hover:bg-[color:var(--color-surface-low)]"
            >
              Browse tours
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-shell space-y-10 py-12">
      <PageHeader
        description={
          data
            ? `Available departures for ${data.name}.`
            : 'Available departures, pricing, and current capacity are listed here once the itinerary is loaded.'
        }
        title="Tour schedules"
      />
      <TourScheduleSection
        tourId={id}
        schedules={data?.schedules ?? []}
        isLoading={detailQuery.isPending}
        isError={detailQuery.isError}
        errorMessage={detailQuery.error?.message}
        onRetry={() => void detailQuery.refetch()}
        isSchedulesRoute
      />
    </div>
  )
}

export default TourSchedulesPage
