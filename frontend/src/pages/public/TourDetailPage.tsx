import { useEffect, useRef } from 'react'
import { Headphones, MapPinned, Plus, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  buildTourDetailPath,
  buildTourSchedulesPath,
  routePaths,
} from '@/app/router/routePaths'
import { useTourDetailQuery } from '@/features/tours/queries/useTourDetailQuery'
import { useTourSchedulesQuery } from '@/features/tours/queries/useTourSchedulesQuery'
import { TourPriceBox } from '@/features/tours/ui/TourPriceBox'
import { DestinationHighlightSection } from '@/widgets/tours/DestinationHighlightSection'
import { TourDetailHero } from '@/widgets/tours/TourDetailHero'
import { TourScheduleSection } from '@/widgets/tours/TourScheduleSection'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

export function TourDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const schedulesSectionRef = useRef<HTMLElement | null>(null)
  const isSchedulesRoute = location.pathname.endsWith('/schedules')
  const detailQuery = useTourDetailQuery(id)
  const schedulesQuery = useTourSchedulesQuery(id)

  useEffect(() => {
    if (!isSchedulesRoute || schedulesQuery.status !== 'success') {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      schedulesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [isSchedulesRoute, schedulesQuery.status])

  if (!id) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Card className="p-10">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[color:var(--color-secondary-strong)]">
            Tour Detail
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
            Missing tour id
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            The requested tour route does not include an id, so we could not load the itinerary.
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

  if (detailQuery.isPending) {
    return <TourDetailPageSkeleton />
  }

  if (detailQuery.isError) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Card className="p-10">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[color:var(--color-secondary-strong)]">
            Tour Detail
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
            We could not load this tour right now
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            {detailQuery.error.message || 'Please try again in a moment.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => void detailQuery.refetch()}>
              Try again
            </Button>
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

  const tour = detailQuery.data

  if (!tour || !tour.id) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Card className="p-10 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
            Tour not found
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            The itinerary you requested is not available in the current catalog.
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

  const detailHref = buildTourDetailPath(tour.id)
  const schedulesHref = buildTourSchedulesPath(tour.id)

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-on-surface-variant)]">
        <Link to={routePaths.public.home} className="transition-colors hover:text-[color:var(--color-primary)]">
          Home
        </Link>
        <span>/</span>
        <Link
          to={routePaths.public.tours}
          className="transition-colors hover:text-[color:var(--color-primary)]"
        >
          Tours
        </Link>
        <span>/</span>
        <Link to={detailHref} className="transition-colors hover:text-[color:var(--color-primary)]">
          {tour.name}
        </Link>
        {isSchedulesRoute ? (
          <>
            <span>/</span>
            <span className="font-semibold text-[color:var(--color-primary)]">Schedules</span>
          </>
        ) : null}
      </nav>

      <TourDetailHero tour={tour} schedulesHref={schedulesHref} isSchedulesRoute={isSchedulesRoute} />

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-16">
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[color:var(--color-primary)]">
              Experience Overview
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-8 text-[color:var(--color-on-surface-variant)] md:text-base">
              {tour.overviewParagraphs.map((paragraph, index) => (
                <p key={`${tour.id}-overview-${index}`}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[color:var(--color-primary)]">
              Trip Itinerary
            </h2>

            {tour.itinerary.length === 0 ? (
              <Card className="mt-8 p-8 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                Detailed itinerary blocks will appear here once operations publishes the day-by-day flow.
              </Card>
            ) : (
              <div className="mt-8 space-y-6">
                {tour.itinerary.map((item, index) => (
                  <div key={item.id} className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-sm font-bold text-white">
                        {item.day_number}
                      </div>
                      {index < tour.itinerary.length - 1 ? (
                        <div className="mt-2 min-h-[72px] w-px flex-1 bg-[color:var(--color-outline-variant)]" />
                      ) : null}
                    </div>

                    <div className="pb-8">
                      <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                        {item.title}
                      </h3>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                        {item.description ||
                          `Day ${item.day_number} is one of the curated anchors of this itinerary.`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section ref={schedulesSectionRef}>
            <TourScheduleSection
              schedules={schedulesQuery.data?.schedules ?? []}
              isLoading={schedulesQuery.isPending}
              isError={schedulesQuery.isError}
              errorMessage={schedulesQuery.error?.message}
              onRetry={() => void schedulesQuery.refetch()}
              isSchedulesRoute={isSchedulesRoute}
            />
          </section>

          <DestinationHighlightSection highlights={tour.highlights} />

          <section className="rounded-[2rem] bg-[color:var(--color-surface-low)] p-8 md:p-10">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[color:var(--color-primary)]">
              FAQ & Reassurance
            </h2>
            <div className="mt-8 space-y-6">
              {tour.faqItems.map((faq, index) => (
                <div
                  key={`${faq.question}-${index}`}
                  className="border-b border-[color:var(--color-outline-variant)] pb-5 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-[color:var(--color-primary)]">{faq.question}</h3>
                    <Plus className="mt-1 h-4 w-4 shrink-0 text-[color:var(--color-on-surface-variant)]" />
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <TourPriceBox
            tour={tour}
            schedulesHref={schedulesHref}
            detailHref={detailHref}
            isSchedulesRoute={isSchedulesRoute}
          />

          <Card className="p-6">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
              Journey Snapshot
            </h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]">
                  <MapPinned className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-on-surface-variant)]">
                    Meeting Point
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-primary)]">
                    {tour.meetingPoint || 'Joining details shared after departure selection.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-on-surface-variant)]">
                    Travel Style
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-primary)]">
                    {tour.tourType || 'Curated premium itinerary'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="hero-gradient p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Headphones className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                  Need help planning?
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/78">
                  The page is already structured for secure handoff into bookings, and our concierge-ready
                  support layer can wrap around that flow next.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function TourDetailPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-36" />
      </div>

      <Skeleton className="h-[420px] w-full rounded-[2rem] md:h-[560px]" />

      <div className="-mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-6 p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:justify-between">
            <div className="space-y-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-14 w-72" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-3 w-12 md:ml-auto" />
              <Skeleton className="h-12 w-36" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        </Card>
        <Card className="space-y-5 p-8">
          <Skeleton className="mx-auto h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-2/3 mx-auto" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-14 w-full" />
        </Card>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-12">
          <Card className="space-y-4 p-8">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-4/5" />
          </Card>
          <Card className="space-y-5 p-8">
            <Skeleton className="h-10 w-48" />
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </Card>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[420px] w-full rounded-[2rem]" />
          <Skeleton className="h-64 w-full rounded-[2rem]" />
        </div>
      </div>
    </div>
  )
}
