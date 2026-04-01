import type { ReactNode } from 'react'
import { ArrowRight, Clock3, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Tour } from '@/features/tours/model/tour.types'
import { cn } from '@/shared/lib/cn'
import { formatCurrency } from '@/shared/lib/formatCurrency'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'

interface TourCardProps {
  tour: Tour
  variant?: 'showcase' | 'catalog'
  href?: string
  ctaLabel?: string
}

const availabilityStyles: Record<Tour['availability'], string> = {
  available: 'bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]',
  limited: 'bg-amber-100 text-amber-700',
  sold_out: 'bg-slate-200 text-slate-600',
}

const availabilityLabels: Record<Tour['availability'], string> = {
  available: 'Available',
  limited: 'Limited',
  sold_out: 'Sold Out',
}

function TourCardAction({
  href,
  ariaLabel,
  className,
  children,
}: {
  href?: string
  ariaLabel: string
  className: string
  children: ReactNode
}) {
  if (href) {
    return (
      <Link to={href} aria-label={ariaLabel} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" aria-label={ariaLabel} className={className}>
      {children}
    </button>
  )
}

export function TourCard({ tour, variant = 'showcase', href, ctaLabel }: TourCardProps) {
  if (variant === 'catalog') {
    return (
      <Card hoverable padding="none" className="group flex h-full flex-col overflow-hidden">
        <div className="relative h-64 overflow-hidden">
          <img
            src={tour.imageUrl}
            alt={tour.imageAlt}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <Badge
            label={tour.featuredLabel ?? availabilityLabels[tour.availability]}
            className="absolute left-4 top-4 bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)] tracking-[0.16em]"
          />
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-[family-name:var(--font-display)] text-[1.75rem] font-extrabold leading-tight tracking-tight text-[color:var(--color-primary)]">
              {tour.name}
            </h3>
            <span className="inline-flex shrink-0 items-center gap-1.5 pt-1 text-sm font-medium text-[color:var(--color-on-surface-variant)]">
              <Clock3 className="h-4 w-4" />
              {tour.durationDays} Days
            </span>
          </div>

          <p className="mt-4 min-h-[3.5rem] text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            {tour.summary}
          </p>

          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <span className="block text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-on-surface-variant)]/75">
                Starting from
              </span>
              <span className="mt-2 block font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[color:var(--color-primary)]">
                {formatCurrency(tour.price, tour.currency)}
              </span>
            </div>

            <TourCardAction
              href={href}
              ariaLabel={ctaLabel ? `${ctaLabel} for ${tour.name}` : `Explore ${tour.name}`}
              className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--color-surface)] px-5 py-3 text-sm font-bold text-[color:var(--color-primary)] transition-all hover:bg-[color:var(--color-primary)] hover:text-white"
            >
              {ctaLabel ?? 'View Itinerary'}
            </TourCardAction>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card hoverable padding="none" className="group overflow-hidden">
      <div className="relative h-64 overflow-hidden">
        <img
          src={tour.imageUrl}
          alt={tour.imageAlt}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <Badge
          label={availabilityLabels[tour.availability]}
          className={cn('absolute right-4 top-4 tracking-[0.16em]', availabilityStyles[tour.availability])}
        />
      </div>

      <div className="p-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-secondary-strong)]">
          {tour.destination}
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
          {tour.name}
        </h3>
        <p className="mt-3 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">{tour.summary}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[color:var(--color-on-surface-variant)]">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            {tour.durationDays} Days
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4" />
            Max {tour.maxGroupSize}
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[color:var(--color-outline-variant)] pt-6">
          <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
            {formatCurrency(tour.price, tour.currency)}
            <span className="ml-2 text-sm font-medium text-[color:var(--color-on-surface-variant)]">
              / person
            </span>
          </p>
          <TourCardAction
            href={href}
            ariaLabel={ctaLabel ?? `Explore ${tour.name}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--color-outline-variant)] text-[color:var(--color-primary)] transition-all hover:bg-[color:var(--color-primary)] hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
          </TourCardAction>
        </div>
      </div>
    </Card>
  )
}
