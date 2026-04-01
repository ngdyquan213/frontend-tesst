import { CalendarRange, Clock3, Users } from 'lucide-react'
import type { TourSchedule } from '@/features/tours/queries/useTourDetailQuery'
import {
  formatDateLabel,
  formatStatusLabel,
  formatTravelerType,
} from '@/features/tours/queries/useTourDetailQuery'
import { Card } from '@/shared/ui/Card'

interface TourScheduleListProps {
  schedules: TourSchedule[]
}

function formatDurationLabel(departureDate: string, returnDate: string) {
  const start = new Date(departureDate)
  const end = new Date(returnDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Custom duration'
  }

  const diffInMs = end.getTime() - start.getTime()
  const diffInDays = Math.max(0, Math.round(diffInMs / (1000 * 60 * 60 * 24)))

  return `${diffInDays + 1} day journey`
}

function formatPriceRuleValue(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

function getScheduleTone(schedule: TourSchedule) {
  if (schedule.available_slots <= 0) {
    return 'bg-red-50 text-red-700'
  }

  if (schedule.available_slots <= Math.max(2, Math.floor(schedule.capacity * 0.2))) {
    return 'bg-amber-50 text-amber-700'
  }

  return 'bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]'
}

export function TourScheduleList({ schedules }: TourScheduleListProps) {
  return (
    <div className="space-y-5">
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-on-surface-variant)]">
                <CalendarRange className="h-4 w-4" />
                <span>
                  {formatDateLabel(schedule.departure_date)} to {formatDateLabel(schedule.return_date)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${getScheduleTone(schedule)}`}
                >
                  {formatStatusLabel(schedule.status)}
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-[color:var(--color-on-surface-variant)]">
                  <Clock3 className="h-4 w-4" />
                  {formatDurationLabel(schedule.departure_date, schedule.return_date)}
                </span>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[color:var(--color-surface-low)] px-4 py-3 text-right">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-on-surface-variant)]">
                Seats
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                {schedule.available_slots}/{schedule.capacity}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {schedule.price_rules && schedule.price_rules.length > 0 ? (
              schedule.price_rules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-[1.5rem] border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-low)]/70 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-on-surface-variant)]">
                    {formatTravelerType(rule.traveler_type)}
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                    {formatPriceRuleValue(rule.price, rule.currency)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-low)]/70 p-5 text-sm text-[color:var(--color-on-surface-variant)] md:col-span-3">
                Traveler pricing for this departure is still being finalized.
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--color-outline-variant)] pt-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-on-surface-variant)]">
              <Users className="h-4 w-4" />
              Departure id ready for booking handoff: {schedule.id}
            </p>

            <button
              type="button"
              disabled
              className="rounded-2xl border border-[color:var(--color-outline-variant)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--color-primary)]"
            >
              Select Departure Soon
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}
