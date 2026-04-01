import { ArrowRight, CalendarDays, MapPinned, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router/routePaths'
import {
  destinationRegionLabels,
  type Destination,
} from '@/features/destinations/model/destination.types'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'

interface DestinationCardProps {
  destination: Destination
}

function buildDestinationToursHref(destination: Destination) {
  return `${routePaths.public.tours}?destination=${encodeURIComponent(destination.tourSearchValue)}`
}

export function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <Card hoverable padding="none" className="group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={destination.imageUrl}
          alt={destination.imageAlt}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4">
          <Badge
            label={destination.eyebrow}
            variant="teal"
            className="bg-white/85 text-[color:var(--color-primary)] backdrop-blur-md"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-secondary-strong)]">
              {destinationRegionLabels[destination.region]}
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-[1.9rem] font-extrabold leading-tight tracking-tight text-[color:var(--color-primary)]">
              {destination.name}
            </h3>
            <p className="mt-2 text-sm font-medium text-[color:var(--color-on-surface-variant)]">
              {destination.country}
            </p>
          </div>

          <div className="text-right">
            <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-on-surface-variant)]/75">
              Starting from
            </span>
            <span className="mt-2 block font-[family-name:var(--font-display)] text-2xl font-extrabold text-[color:var(--color-primary)]">
              {destination.startingPrice === null
                ? 'On request'
                : formatCurrency(destination.startingPrice, destination.currency)}
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
          {destination.summary}
        </p>

        <div className="mt-6 space-y-3 text-sm text-[color:var(--color-on-surface-variant)]">
          <div className="inline-flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-[color:var(--color-secondary-strong)]" />
            {destination.signatureLabel}
          </div>
          <div className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[color:var(--color-secondary-strong)]" />
            {destination.bestTimeLabel}
          </div>
          <div className="inline-flex items-center gap-2">
            <Ticket className="h-4 w-4 text-[color:var(--color-secondary-strong)]" />
            {destination.tourCount} curated {destination.tourCount === 1 ? 'tour' : 'tours'} ready
          </div>
        </div>

        <div className="mt-8 border-t border-[color:var(--color-outline-variant)] pt-6">
          <Link
            to={buildDestinationToursHref(destination)}
            className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--color-secondary-strong)] transition-all hover:gap-3"
          >
            View tours
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  )
}
