import { ArrowRight, BadgePercent, CalendarRange, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePromotionsQuery } from '@/features/promotions/queries/usePromotionsQuery'
import { routePaths } from '@/app/router/routePaths'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

function formatPromotionWindow(validFrom: string, validUntil?: string) {
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const start = dateFormatter.format(new Date(validFrom))

  if (!validUntil) {
    return `From ${start}`
  }

  return `${start} to ${dateFormatter.format(new Date(validUntil))}`
}

export function TestimonialsSection() {
  const promotionsQuery = usePromotionsQuery({
    status: 'active',
    featuredOnly: true,
    limit: 3,
  })

  return (
    <section id={routePaths.sections.testimonials} className="bg-white/60 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          title="Live Travel Offers"
          subtitle="Promotions below are loaded directly from the public backend catalog instead of placeholder testimonials."
          align="center"
        />

        {promotionsQuery.isPending ? (
          <div className="grid gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-12 w-4/5" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-6 w-40" />
              </Card>
            ))}
          </div>
        ) : promotionsQuery.isError ? (
          <Card className="p-8 text-center">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
              We could not load the current offers
            </h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
              {promotionsQuery.error.message || 'Please try again in a moment.'}
            </p>
            <div className="mt-6">
              <Button type="button" variant="secondary" onClick={() => void promotionsQuery.refetch()}>
                Try again
              </Button>
            </div>
          </Card>
        ) : !promotionsQuery.data?.length ? (
          <Card className="p-8 text-center">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
              No featured offers are live right now
            </h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
              The tours catalog is still available while the next promotional window is being prepared.
            </p>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {promotionsQuery.data.map((promotion) => (
              <Card key={promotion.id} className="relative">
                <div className="flex items-center gap-3 text-[color:var(--color-secondary-strong)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-secondary-container)]">
                    <BadgePercent className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.18em]">
                    {promotion.badge}
                  </span>
                </div>

                <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                  {promotion.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                  {promotion.offerSummary}
                </p>

                <div className="mt-6 space-y-3 border-t border-[color:var(--color-outline-variant)] pt-6">
                  <div className="flex items-start gap-3 text-sm text-[color:var(--color-on-surface)]">
                    <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[color:var(--color-secondary-strong)]" />
                    <span>{promotion.applicableLabel}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-[color:var(--color-on-surface)]">
                    <CalendarRange className="mt-1 h-4 w-4 shrink-0 text-[color:var(--color-secondary-strong)]" />
                    <span>{formatPromotionWindow(promotion.validFrom, promotion.validUntil)}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to={promotion.primaryCta.href}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--color-secondary-strong)] transition-all hover:gap-3"
                  >
                    {promotion.primaryCta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
