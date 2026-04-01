import type { ReactNode } from 'react'
import { CalendarDays, ChevronDown, MapPinned, Search, Users } from 'lucide-react'
import { buildTourSearchParams } from '@/features/tours/lib/buildTourSearchParams'
import type {
  TourDurationFilter,
  TourGroupSizeFilter,
  TourPriceRangeFilter,
  TourSearchFilterValues,
} from '@/features/tours/model/tour.types'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

interface TourSearchFiltersProps {
  value: TourSearchFilterValues
  isLoading?: boolean
  onChange: (nextValue: TourSearchFilterValues) => void
  onSubmit: () => void
  onPriceRangeChange: (priceRange: TourPriceRangeFilter) => void
  onClear: () => void
}

const durationOptions: Array<{ value: TourDurationFilter; label: string }> = [
  { value: 'all', label: 'Any duration' },
  { value: 'short', label: '1-5 days' },
  { value: 'medium', label: '6-9 days' },
  { value: 'long', label: '10+ days' },
]

const groupSizeOptions: Array<{ value: TourGroupSizeFilter; label: string }> = [
  { value: 'all', label: 'Any group size' },
  { value: 'intimate', label: 'Up to 8 guests' },
  { value: 'shared', label: '9-12 guests' },
  { value: 'large', label: '13+ guests' },
]

const priceRangeOptions: Array<{ value: TourPriceRangeFilter; label: string }> = [
  { value: 'under-1500', label: 'Under $1,500' },
  { value: '1500-2500', label: '$1,500-$2,500' },
  { value: '2500-plus', label: '$2,500+' },
]

interface SearchFieldProps {
  label: string
  icon: ReactNode
  children: ReactNode
}

function SearchField({ label, icon, children }: SearchFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="ml-1 text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--color-primary-strong)]/65">
        {label}
      </span>
      <div className="relative flex min-h-[4.25rem] items-center gap-3 rounded-2xl bg-[color:var(--color-surface)] px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-[color:var(--color-primary)]/15">
        <div className="text-[color:var(--color-primary)]/40">{icon}</div>
        {children}
      </div>
    </label>
  )
}

export function TourSearchFilters({
  value,
  isLoading = false,
  onChange,
  onSubmit,
  onPriceRangeChange,
  onClear,
}: TourSearchFiltersProps) {
  const hasActiveFilters = Object.keys(buildTourSearchParams(value)).length > 0

  return (
    <section>
      <form
        className="rounded-[2rem] bg-[color:var(--color-surface-lowest)] p-6 shadow-[0_40px_60px_-15px_rgba(0,17,58,0.08)] md:p-8"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto] xl:items-end">
          <SearchField label="Destination" icon={<MapPinned className="h-5 w-5" />}>
            <input
              type="text"
              value={value.destination}
              onChange={(event) => onChange({ ...value, destination: event.target.value })}
              placeholder="Where to next?"
              className="w-full bg-transparent text-base font-medium text-[color:var(--color-primary)] outline-none placeholder:text-[color:var(--color-outline)]"
            />
          </SearchField>

          <SearchField label="Duration" icon={<CalendarDays className="h-5 w-5" />}>
            <div className="relative w-full">
              <select
                value={value.duration}
                onChange={(event) =>
                  onChange({ ...value, duration: event.target.value as TourDurationFilter })
                }
                className="w-full appearance-none bg-transparent pr-8 text-base font-medium text-[color:var(--color-primary)] outline-none"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-outline)]" />
            </div>
          </SearchField>

          <SearchField label="Travelers" icon={<Users className="h-5 w-5" />}>
            <div className="relative w-full">
              <select
                value={value.groupSize}
                onChange={(event) =>
                  onChange({ ...value, groupSize: event.target.value as TourGroupSizeFilter })
                }
                className="w-full appearance-none bg-transparent pr-8 text-base font-medium text-[color:var(--color-primary)] outline-none"
              >
                {groupSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-outline)]" />
            </div>
          </SearchField>

          <Button
            type="submit"
            variant="hero"
            size="xl"
            loading={isLoading}
            className="w-full xl:w-auto"
            leadingIcon={!isLoading ? <Search className="h-4 w-4" /> : undefined}
          >
            Search
          </Button>
        </div>
      </form>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="px-2 text-sm font-semibold text-[color:var(--color-on-surface-variant)]">
          Filter by:
        </span>

        {priceRangeOptions.map((option) => {
          const isActive = value.priceRange === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onPriceRangeChange(option.value)}
              className={cn(
                'rounded-full border px-5 py-2 text-sm font-semibold transition-all',
                isActive
                  ? 'border-transparent bg-[color:var(--color-primary)] text-white shadow-[0_12px_24px_rgba(0,17,58,0.12)]'
                  : 'border-[color:var(--color-outline-variant)] bg-white text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-high)]'
              )}
            >
              {option.label}
            </button>
          )
        })}

        <button
          type="button"
          onClick={onClear}
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
    </section>
  )
}
