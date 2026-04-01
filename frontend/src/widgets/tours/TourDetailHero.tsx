import { BadgeCheck, CalendarRange, MapPin, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TourDetail } from '@/features/tours/queries/useTourDetailQuery'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'

interface TourDetailHeroProps {
  tour: TourDetail
  schedulesHref: string
  isSchedulesRoute?: boolean
}

function getBadgeIcon(tone: TourDetail['heroBadges'][number]['tone']) {
  switch (tone) {
    case 'verified':
      return <BadgeCheck className="h-3.5 w-3.5" />
    case 'instant':
      return <Sparkles className="h-3.5 w-3.5" />
    default:
      return null
  }
}

export function TourDetailHero({
  tour,
  schedulesHref,
  isSchedulesRoute = false,
}: TourDetailHeroProps) {
  return (
    <section>
      <div className="relative overflow-hidden rounded-[2rem] shadow-[0_32px_72px_rgba(15,23,42,0.16)]">
        <img
          src={tour.heroImageUrl}
          alt={tour.heroImageAlt}
          className="h-[420px] w-full object-cover md:h-[560px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,17,58,0.6)] via-[rgba(0,17,58,0.08)] to-transparent" />
        <div className="absolute left-5 top-5 flex flex-wrap gap-3 md:left-7 md:top-7">
          {tour.heroBadges.map((badge) => (
            <Badge
              key={badge.label}
              size="md"
              className={
                badge.tone === 'verified'
                  ? 'bg-white/90 text-[color:var(--color-primary)] backdrop-blur-md'
                  : 'bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]'
              }
            >
              {getBadgeIcon(badge.tone)}
              {badge.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="relative z-10 -mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-secondary-strong)]">
                {tour.code ?? tour.status}
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[color:var(--color-primary)] md:text-5xl">
                {tour.name}
              </h1>
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-secondary-strong)]">
                <MapPin className="h-4 w-4" />
                {tour.destination}
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-on-surface-variant)]">
                Price
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[color:var(--color-primary)]">
                {tour.priceSummary.displayPrice}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-[1.5rem] bg-[color:var(--color-surface-low)] p-5 md:grid-cols-4">
            {tour.facts.map((fact) => (
              <div key={fact.label}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-on-surface-variant)]">
                  {fact.label}
                </p>
                <p
                  className={`mt-2 text-sm font-bold ${fact.accent ? 'text-[color:var(--color-secondary-strong)]' : 'text-[color:var(--color-primary)]'}`}
                >
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-8 text-center">
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-primary)]/6 text-[color:var(--color-primary)]">
              {isSchedulesRoute ? <CalendarRange className="h-8 w-8" /> : <Users className="h-8 w-8" />}
            </div>
            <h2 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
              {isSchedulesRoute ? 'Departure Calendar' : 'Secure Your Spot'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--color-on-surface-variant)]">
              {isSchedulesRoute
                ? 'You are viewing the schedule-focused route. Published departures and pricing are highlighted below.'
                : 'Compare departure dates, traveler pricing, and availability in a premium booking-ready layout.'}
            </p>
          </div>

          <Link
            to={schedulesHref}
            className="hero-gradient mt-8 inline-flex items-center justify-center rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-[0_18px_42px_rgba(0,17,58,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_46px_rgba(0,17,58,0.28)]"
          >
            View Schedules
          </Link>
        </Card>
      </div>
    </section>
  )
}
