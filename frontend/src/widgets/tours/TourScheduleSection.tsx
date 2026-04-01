import { CalendarSearch } from 'lucide-react'
import { TourScheduleList } from '@/features/tours/ui/TourScheduleList'
import type { TourSchedule } from '@/features/tours/queries/useTourDetailQuery'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

interface TourScheduleSectionProps {
  schedules: TourSchedule[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  isSchedulesRoute?: boolean
}

function SchedulesLoadingState() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index} className="space-y-5 p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="h-20 w-28" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((__, priceIndex) => (
              <Skeleton key={priceIndex} className="h-28 w-full" />
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

export function TourScheduleSection({
  schedules,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  isSchedulesRoute = false,
}: TourScheduleSectionProps) {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[color:var(--color-secondary-strong)]">
            Departures
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[color:var(--color-primary)] md:text-4xl">
            {isSchedulesRoute ? 'Published Schedules' : 'Choose Your Departure'}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            Capacity, traveler pricing, and departure ids are already prepared so the bookings flow can
            attach to the chosen schedule without reshaping the UI later.
          </p>
        </div>
      </div>

      {isLoading ? <SchedulesLoadingState /> : null}

      {!isLoading && isError ? (
        <Card className="p-8">
          <p className="text-lg font-bold text-[color:var(--color-primary)]">
            We could not load departure schedules right now.
          </p>
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            {errorMessage || 'Please try again in a moment.'}
          </p>
          {onRetry ? (
            <div className="mt-6">
              <Button type="button" variant="secondary" onClick={onRetry}>
                Try again
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {!isLoading && !isError && schedules.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-primary)]/6 text-[color:var(--color-primary)]">
            <CalendarSearch className="h-8 w-8" />
          </div>
          <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
            No departures published yet
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            This itinerary is still ready for the future bookings handoff, but operations has not published
            departure dates or traveler pricing yet.
          </p>
        </Card>
      ) : null}

      {!isLoading && !isError && schedules.length > 0 ? <TourScheduleList schedules={schedules} /> : null}
    </section>
  )
}
