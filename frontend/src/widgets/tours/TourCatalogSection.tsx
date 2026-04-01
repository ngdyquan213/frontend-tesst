import { startTransition, useEffect, useState } from 'react'
import { BadgeCheck, Headphones, ShieldCheck } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { buildTourDetailPath } from '@/app/router/routePaths'
import {
  buildTourSearchParams,
  buildTourSearchQueryString,
  hasActiveTourSearchParams,
  parseTourSearchFilters,
} from '@/features/tours/lib/buildTourSearchParams'
import { DEFAULT_TOUR_SEARCH_FILTERS } from '@/features/tours/model/tour.types'
import type { TourPriceRangeFilter, TourSearchFilterValues } from '@/features/tours/model/tour.types'
import { useTourCatalogQuery } from '@/features/tours/queries/useToursQuery'
import { TourCard } from '@/features/tours/ui/TourCard'
import { TourSearchFilters } from '@/features/tours/ui/TourSearchFilters'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

const reassuranceItems = [
  {
    title: 'Secure Payments',
    subtitle: 'Encrypted and reliable transactions.',
    icon: ShieldCheck,
  },
  {
    title: '24/7 Support',
    subtitle: 'Global help desk always available.',
    icon: Headphones,
  },
  {
    title: 'Verified Tours',
    subtitle: 'Vetted for quality and safety.',
    icon: BadgeCheck,
  },
] as const

function TourCatalogSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[color:var(--color-outline-variant)] bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
      <Skeleton className="h-64 w-full rounded-none" />
      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-end justify-between gap-4 pt-3">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
    </div>
  )
}

export function TourCatalogSection() {
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedFilters = parseTourSearchFilters(searchParams)
  const [draftFilters, setDraftFilters] = useState<TourSearchFilterValues>(appliedFilters)

  useEffect(() => {
    setDraftFilters(appliedFilters)
  }, [
    appliedFilters.destination,
    appliedFilters.duration,
    appliedFilters.groupSize,
    appliedFilters.priceRange,
  ])

  const queryParams = buildTourSearchParams(appliedFilters)
  const hasActiveFilters = hasActiveTourSearchParams(queryParams)
  const { data = [], isPending, isFetching, isError, error, refetch } = useTourCatalogQuery(queryParams)

  const applyFilters = (nextFilters: TourSearchFilterValues) => {
    startTransition(() => {
      setSearchParams(buildTourSearchQueryString(nextFilters), { replace: true })
    })
  }

  const handlePriceRangeChange = (priceRange: TourPriceRangeFilter) => {
    const nextFilters: TourSearchFilterValues = {
      ...draftFilters,
      priceRange: draftFilters.priceRange === priceRange ? 'all' : priceRange,
    }

    setDraftFilters(nextFilters)
    applyFilters(nextFilters)
  }

  const handleClearFilters = () => {
    setDraftFilters(DEFAULT_TOUR_SEARCH_FILTERS)
    applyFilters(DEFAULT_TOUR_SEARCH_FILTERS)
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-[color:var(--color-secondary-strong)]">
          Curated Tour Catalog
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight text-[color:var(--color-primary)] md:text-6xl">
          Find Your Next Tour
        </h1>
        <p className="mt-4 text-lg leading-8 text-[color:var(--color-on-surface-variant)]">
          Reliable itineraries designed for practical planning and clear decision-making.
        </p>
      </header>

      <div className="mt-12">
        <TourSearchFilters
          value={draftFilters}
          isLoading={isPending || isFetching}
          onChange={setDraftFilters}
          onSubmit={() => applyFilters(draftFilters)}
          onPriceRangeChange={handlePriceRangeChange}
          onClear={handleClearFilters}
        />
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[color:var(--color-on-surface-variant)]">
          {isPending
            ? 'Loading curated tours...'
            : `${data.length} curated ${data.length === 1 ? 'tour' : 'tours'} ready to compare.`}
        </p>
        {isFetching && !isPending ? (
          <span className="text-sm font-semibold text-[color:var(--color-secondary-strong)]">
            Refreshing results...
          </span>
        ) : null}
      </div>

      <div className="mt-8">
        {isPending ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <TourCatalogSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <Card className="rounded-[2rem] p-8">
            <p className="text-lg font-bold text-[color:var(--color-primary)]">
              We could not load the tour catalog right now.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
              {error.message || 'Please try again in a moment.'}
            </p>
            <div className="mt-6">
              <Button type="button" variant="secondary" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          </Card>
        ) : data.length === 0 ? (
          <Card className="rounded-[2rem] p-10 text-center">
            <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
              No tours matched this search.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
              Try broadening the destination keyword or clearing one of the active filters to see more curated departures.
            </p>
            {hasActiveFilters ? (
              <div className="mt-6">
                <Button type="button" variant="secondary" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : null}
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {data.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                variant="catalog"
                href={buildTourDetailPath(tour.id)}
                ctaLabel="View Itinerary"
              />
            ))}
          </div>
        )}
      </div>

      <section className="mt-20 rounded-[2rem] bg-[color:var(--color-surface-low)] p-8">
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {reassuranceItems.map((item) => {
            const Icon = item.icon

            return (
              <div key={item.title} className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[color:var(--color-secondary-strong)] shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--color-primary)]">
                    {item.title}
                  </p>
                  <p className="text-sm text-[color:var(--color-on-surface-variant)]">{item.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </section>
  )
}
