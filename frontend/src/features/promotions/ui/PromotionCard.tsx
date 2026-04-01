import { ArrowRight, CalendarDays, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/ui/Badge'
import {
  promotionCategoryLabels,
  promotionStatusLabels,
  type Promotion,
} from '@/features/promotions/model/promotion.types'

interface PromotionCardProps {
  promotion: Promotion
  variant?: 'catalog' | 'feature'
}

const statusStyles: Record<Promotion['status'], string> = {
  active: 'bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]',
  limited: 'bg-amber-100 text-amber-800',
  expired: 'bg-slate-200 text-slate-700',
}

function formatPromotionDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function PromotionCtas({ promotion }: { promotion: Promotion }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        to={promotion.primaryCta.href}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,17,58,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-primary-strong)]"
      >
        {promotion.primaryCta.label}
        <ArrowRight className="h-4 w-4" />
      </Link>
      {promotion.secondaryCta ? (
        <Link
          to={promotion.secondaryCta.href}
          className="inline-flex items-center justify-center rounded-xl border border-[color:var(--color-outline-variant)] px-5 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition-colors hover:bg-[color:var(--color-surface-low)]"
        >
          {promotion.secondaryCta.label}
        </Link>
      ) : null}
    </div>
  )
}

export function PromotionCard({ promotion, variant = 'catalog' }: PromotionCardProps) {
  const validityLabel = promotion.validUntil
    ? `Valid until ${formatPromotionDate(promotion.validUntil)}`
    : `Started ${formatPromotionDate(promotion.validFrom)}`

  if (variant === 'feature') {
    return (
      <Card hoverable padding="none" className="group overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <Badge label={promotionCategoryLabels[promotion.category]} variant="teal" />
              <Badge
                label={promotionStatusLabels[promotion.status]}
                className={cn('tracking-[0.16em]', statusStyles[promotion.status])}
              />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-secondary-strong)]">
              {promotion.eyebrow}
            </p>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[color:var(--color-primary)]">
              {promotion.title}
            </h3>
            <p className="mt-4 text-base leading-8 text-[color:var(--color-primary)]">{promotion.offerSummary}</p>
            <p className="mt-4 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
              {promotion.description}
            </p>

            <div className="mt-6 rounded-[1.5rem] bg-[color:var(--color-surface-low)] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-on-surface-variant)]/80">
                Eligible journeys
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                {promotion.applicableLabel}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-5 text-sm text-[color:var(--color-on-surface-variant)]">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {validityLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {promotion.badge}
              </span>
            </div>

            <div className="mt-8">
              <PromotionCtas promotion={promotion} />
            </div>
          </div>

          <div className="relative min-h-[280px] overflow-hidden">
            <img
              src={promotion.imageUrl}
              alt={promotion.imageAlt}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-x-6 bottom-6 rounded-[1.5rem] bg-white/90 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.16)] backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-secondary-strong)]">
                Offer detail
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-primary)]">{promotion.offerSummary}</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card hoverable padding="none" className="group flex h-full flex-col overflow-hidden">
      <div className="relative h-64 overflow-hidden">
        <img
          src={promotion.imageUrl}
          alt={promotion.imageAlt}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
          <Badge
            label={promotionCategoryLabels[promotion.category]}
            variant="teal"
            className="bg-white/85 text-[color:var(--color-primary)] backdrop-blur-md"
          />
          <Badge
            label={promotionStatusLabels[promotion.status]}
            className={cn('tracking-[0.16em] backdrop-blur-md', statusStyles[promotion.status])}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-secondary-strong)]">
          {promotion.eyebrow}
        </p>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-[1.9rem] font-extrabold leading-tight tracking-tight text-[color:var(--color-primary)]">
          {promotion.title}
        </h3>
        <p className="mt-4 text-base leading-8 text-[color:var(--color-primary)]">{promotion.offerSummary}</p>
        <p className="mt-3 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">{promotion.description}</p>

        <div className="mt-6 rounded-[1.25rem] bg-[color:var(--color-surface-low)] px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-on-surface-variant)]/80">
            Applies to
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            {promotion.applicableLabel}
          </p>
        </div>

        <div className="mt-6 space-y-3 text-sm text-[color:var(--color-on-surface-variant)]">
          <div className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {validityLabel}
          </div>
          <div className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            {promotion.badge}
          </div>
        </div>

        <div className="mt-8 border-t border-[color:var(--color-outline-variant)] pt-6">
          <PromotionCtas promotion={promotion} />
        </div>
      </div>
    </Card>
  )
}
