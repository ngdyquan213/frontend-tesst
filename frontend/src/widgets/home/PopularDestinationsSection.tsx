import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router/routePaths'
import {
  destinationRegionLabels,
  useDestinationsQuery,
  type Destination,
} from '@/features/destinations'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { buildQueryString } from '@/shared/lib/buildQueryString'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

interface PopularDestinationsSectionProps {
  sectionId?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  featuredOnly?: boolean
  limit?: number
  align?: 'left' | 'center'
  actionLabel?: string
  actionHref?: string
}

const tileClasses = [
  'md:col-span-2 min-h-[320px]',
  'min-h-[220px]',
  'min-h-[220px]',
  'md:col-span-2 min-h-[280px]',
] as const

function buildDestinationToursHref(destination: Destination) {
  const queryString = buildQueryString({
    destination: destination.tourSearchValue,
  })

  return queryString
    ? `${routePaths.public.tours}?${queryString}`
    : routePaths.public.tours
}

function DestinationTileSkeleton({ className }: { className: string }) {
  return <Skeleton className={`${className} rounded-[28px]`} />
}

export function PopularDestinationsSection({
  sectionId = routePaths.sections.destinations,
  eyebrow = 'Discovery',
  title = 'Discover Your Next Chapter',
  subtitle = 'From sun-drenched coastlines to mist-covered peaks, find the destination that speaks to your next journey.',
  featuredOnly = true,
  limit = 4,
  align = 'center',
  actionLabel = 'Explore all destinations',
  actionHref = routePaths.public.destinations,
}: PopularDestinationsSectionProps) {
  const { data = [], isPending, isError, error } = useDestinationsQuery({
    featuredOnly,
    limit,
  })

  return (
    <section
      id={sectionId}
      className="bg-[color:var(--color-surface-low)] py-24"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          align={align}
          action={
            <Link
              to={actionHref}
              className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--color-secondary-strong)] transition-all hover:gap-3"
            >
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />

        {isPending ? (
          <div className="grid gap-6 md:grid-cols-4">
            {Array.from({ length: limit }).map((_, index) => (
              <DestinationTileSkeleton
                key={index}
                className={tileClasses[index] ?? 'min-h-[240px]'}
              />
            ))}
          </div>
        ) : isError ? (
          <Card className="rounded-[2rem] p-8 text-sm leading-7 text-red-700">
            {error.message || 'Unable to load destination highlights right now.'}
          </Card>
        ) : data.length === 0 ? (
          <Card className="rounded-[2rem] p-10 text-center text-[color:var(--color-on-surface-variant)]">
            Destination highlights will appear here once curated inventory is
            available.
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-4">
            {data.map((destination, index) => (
              <Link
                key={destination.id}
                to={buildDestinationToursHref(destination)}
                className={`${tileClasses[index] ?? 'min-h-[240px]'} group relative overflow-hidden rounded-[28px] shadow-[var(--shadow-soft)]`}
              >
                <img
                  src={destination.imageUrl}
                  alt={destination.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,17,58,0.86)] via-[rgba(0,17,58,0.18)] to-transparent" />

                <div className="absolute left-6 top-6">
                  <span className="inline-flex rounded-full bg-white/88 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-primary)] backdrop-blur-md">
                    {destinationRegionLabels[destination.region]}
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                    {destination.country}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
                    {destination.name}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-7 text-white/78">
                    {destination.tourCount} curated{' '}
                    {destination.tourCount === 1 ? 'tour' : 'tours'} ready
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
