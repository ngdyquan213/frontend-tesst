import { startTransition, useDeferredValue, useState } from 'react'
import { ArrowRight, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DestinationCard,
  destinationRegionLabels,
  destinationRegionOptions,
  useDestinationsQuery,
  type DestinationRegionFilter,
} from '@/features/destinations'
import { cn } from '@/shared/lib/cn'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'
import { routePaths } from '@/app/router/routePaths'

function DestinationCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[color:var(--color-outline-variant)] bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-4 p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
  )
}

export function DestinationSection() {
  const [searchValue, setSearchValue] = useState('')
  const [activeRegion, setActiveRegion] = useState<DestinationRegionFilter>('all')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const deferredSearchValue = useDeferredValue(searchValue)

  const queryParams = {
    query: deferredSearchValue,
    region: activeRegion === 'all' ? undefined : activeRegion,
    featuredOnly,
  }

  const hasActiveFilters =
    searchValue.trim().length > 0 || activeRegion !== 'all' || featuredOnly

  const {
    data = [],
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useDestinationsQuery(queryParams)

  const handleClearFilters = () => {
    startTransition(() => {
      setSearchValue('')
      setActiveRegion('all')
      setFeaturedOnly(false)
    })
  }

  return (
    <section id="destination-catalog" className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <SectionHeader
        eyebrow="Destination Catalog"
        title="Browse destinations with verified tour inventory"
        subtitle="Search by mood, narrow by region, and move straight into the currently published journeys behind each destination."
        action={
          <Link
            to={routePaths.public.tours}
            className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--color-secondary-strong)] transition-all hover:gap-3"
          >
            See all tours
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <Card className="rounded-[2rem] border-white/60 bg-white/80 p-6 shadow-[0_30px_60px_-24px_rgba(0,17,58,0.16)] backdrop-blur-xl md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="ml-1 text-xs font-bold uppercase tracking-[0.26em] text-[color:var(--color-primary)]/65">
              Search destinations
            </span>
            <div className="mt-2 flex min-h-[4.25rem] items-center gap-3 rounded-[1.5rem] bg-[color:var(--color-surface)] px-5 shadow-[inset_0_0_0_1px_rgba(197,198,210,0.55)]">
              <Search className="h-5 w-5 text-[color:var(--color-primary)]/40" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search by destination, country, or travel style"
                className="w-full bg-transparent text-base font-medium text-[color:var(--color-primary)] outline-none placeholder:text-[color:var(--color-outline)]"
              />
            </div>
          </label>

          <button
            type="button"
            onClick={() => startTransition(() => setFeaturedOnly((currentValue) => !currentValue))}
            className={cn(
              'inline-flex min-h-[4.25rem] items-center justify-center gap-2 rounded-[1.5rem] border px-5 py-3 text-sm font-semibold transition-all',
              featuredOnly
                ? 'border-transparent bg-[color:var(--color-primary)] text-white shadow-[0_18px_32px_rgba(0,17,58,0.18)]'
                : 'border-[color:var(--color-outline-variant)] bg-white text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-low)]'
            )}
          >
            <Sparkles className="h-4 w-4" />
            Curated picks only
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {destinationRegionOptions.map((region) => {
            const isActive = activeRegion === region

            return (
              <button
                key={region}
                type="button"
                onClick={() => startTransition(() => setActiveRegion(region))}
                className={cn(
                  'rounded-full border px-5 py-2 text-sm font-semibold transition-all',
                  isActive
                    ? 'border-transparent bg-[color:var(--color-primary)] text-white shadow-[0_12px_24px_rgba(0,17,58,0.12)]'
                    : 'border-[color:var(--color-outline-variant)] bg-white text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-low)]'
                )}
              >
                {destinationRegionLabels[region]}
              </button>
            )
          })}

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-semibold transition-all',
              hasActiveFilters
                ? 'bg-[color:var(--color-primary)]/6 text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/10'
                : 'bg-[color:var(--color-surface)] text-[color:var(--color-outline)]'
            )}
          >
            Clear all
          </button>
        </div>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[color:var(--color-on-surface-variant)]">
          {isPending
            ? 'Loading destination collection...'
            : `${data.length} destination${data.length === 1 ? '' : 's'} currently available to explore.`}
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
              <DestinationCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <Card className="rounded-[2rem] p-8">
            <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
              We could not load destinations right now.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
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
              No destinations matched this filter.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
              Try widening the search keyword or clearing one of the active filters to bring the full destination collection back.
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
            {data.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
