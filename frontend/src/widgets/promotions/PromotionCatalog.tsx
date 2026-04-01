import { useState } from 'react'
import { Clock3, Filter } from 'lucide-react'
import {
  PromotionCard,
  promotionCategoryLabels,
  promotionFilterOptions,
  usePromotionsQuery,
  type PromotionFilterValue,
} from '@/features/promotions'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'
import { cn } from '@/shared/lib/cn'

const statusNotes = [
  {
    label: 'Active',
    description: 'Confirmed offers currently ready to apply.',
    className: 'bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]',
  },
  {
    label: 'Limited',
    description: 'Tighter inventory or shorter promotional windows.',
    className: 'bg-amber-100 text-amber-800',
  },
  {
    label: 'Expired',
    description: 'Shown transparently as closed editorial campaigns.',
    className: 'bg-slate-200 text-slate-700',
  },
] as const

function PromotionCatalogSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[color:var(--color-outline-variant)] bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
      <Skeleton className="h-64 w-full rounded-none" />
      <div className="space-y-4 p-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-4/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-24 w-full" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-36" />
        </div>
      </div>
    </div>
  )
}

export function PromotionCatalogSection() {
  const [activeFilter, setActiveFilter] = useState<PromotionFilterValue>('all')
  const selectedCategory = activeFilter === 'all' ? undefined : activeFilter

  const { data = [], isPending, isFetching, isError, error, refetch } = usePromotionsQuery({
    category: selectedCategory,
  })

  return (
    <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
      <SectionHeader
        eyebrow="Offer Catalog"
        title="Browse every current promotion"
        subtitle="Filter by promotion type, compare status at a glance, and jump directly into tours or booking schedules without leaving the catalog."
      />

      <div className="rounded-[2rem] border border-[color:var(--color-outline-variant)] bg-white/82 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-[color:var(--color-primary)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-surface-low)]">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-secondary-strong)]">
                Filter by promotion type
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-on-surface-variant)]">
                {activeFilter === 'all'
                  ? 'Showing the full promotion catalog.'
                  : `Showing ${promotionCategoryLabels[activeFilter]} offers.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {promotionFilterOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all',
                  activeFilter === option
                    ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-white shadow-[0_12px_26px_rgba(0,17,58,0.14)]'
                    : 'border-[color:var(--color-outline-variant)] bg-white text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-low)]'
                )}
                onClick={() => setActiveFilter(option)}
              >
                {option === 'all' ? 'All Offers' : promotionCategoryLabels[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {statusNotes.map((note) => (
            <div key={note.label} className="rounded-[1.5rem] bg-[color:var(--color-surface-low)] px-5 py-5">
              <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]', note.className)}>
                {note.label}
              </span>
              <p className="mt-4 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">{note.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[color:var(--color-on-surface-variant)]">
          {isPending
            ? 'Loading current promotions...'
            : `${data.length} ${data.length === 1 ? 'promotion' : 'promotions'} available to review.`}
        </p>
        {isFetching && !isPending ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-secondary-strong)]">
            <Clock3 className="h-4 w-4" />
            Refreshing catalog...
          </span>
        ) : null}
      </div>

      <div className="mt-8">
        {isPending ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <PromotionCatalogSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <Card className="rounded-[2rem] p-8">
            <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
              We could not load the promotions catalog.
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
              No promotions matched this filter.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
              Switch back to the full catalog to review all available offers and archived seasonal campaigns.
            </p>
            <div className="mt-6">
              <Button type="button" variant="secondary" onClick={() => setActiveFilter('all')}>
                Clear filter
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {data.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
