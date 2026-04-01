import { CalendarDays, Lock, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TourDetail } from '@/features/tours/queries/useTourDetailQuery'
import { Card } from '@/shared/ui/Card'

interface TourPriceBoxProps {
  tour: TourDetail
  schedulesHref: string
  detailHref: string
  isSchedulesRoute?: boolean
}

export function TourPriceBox({
  tour,
  schedulesHref,
  detailHref,
  isSchedulesRoute = false,
}: TourPriceBoxProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="hero-gradient px-6 py-7 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/65">From</p>
        <p className="mt-3 font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight">
          {tour.priceSummary.displayPrice}
        </p>
        <p className="mt-2 text-sm leading-6 text-white/75">
          Per traveler pricing with secure departure comparison already wired for the future bookings
          handoff.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div className="rounded-[1.5rem] bg-[color:var(--color-surface-low)] p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[color:var(--color-primary)] shadow-sm">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-on-surface-variant)]">
                Next Departure
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--color-primary)]">
                {tour.priceSummary.nextDepartureLabel}
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-on-surface-variant)]">
                {tour.priceSummary.capacityLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--color-outline-variant)] bg-white p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-on-surface-variant)]">
              Route Status
            </p>
            <p className="mt-2 text-sm font-semibold text-[color:var(--color-primary)]">
              {tour.status}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-on-surface-variant)]">
              Booking Readiness
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-on-surface-variant)]">
              {tour.bookingPreviewNote}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to={isSchedulesRoute ? detailHref : schedulesHref}
            className="hero-gradient inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-[0_18px_42px_rgba(0,17,58,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_46px_rgba(0,17,58,0.28)]"
          >
            {isSchedulesRoute ? 'Back to Overview' : 'View Schedules'}
          </Link>

          <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-low)] px-5 py-4 text-sm font-semibold text-[color:var(--color-primary)]"
          >
            <Sparkles className="h-4 w-4" />
            Booking Flow Coming Soon
          </button>
        </div>

        <p className="flex items-start gap-2 text-xs leading-5 text-[color:var(--color-on-surface-variant)]">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-primary)]" />
          Secure departure selection and traveler-price mapping are ready to connect once the bookings
          feature is turned on.
        </p>
      </div>
    </Card>
  )
}
