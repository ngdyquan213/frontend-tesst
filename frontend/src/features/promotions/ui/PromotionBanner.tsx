import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/shared/ui/Badge'
import { cn } from '@/shared/lib/cn'
import {
  promotionStatusLabels,
  type PromotionBannerData,
} from '@/features/promotions/model/promotion.types'

interface PromotionBannerProps {
  banner: PromotionBannerData
}

const statusStyles: Record<PromotionBannerData['status'], string> = {
  active: 'bg-white/20 text-white',
  limited: 'bg-amber-200/90 text-amber-950',
  expired: 'bg-slate-200/90 text-slate-950',
}

function formatPromotionWindow(validFrom: string, validUntil?: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (!validUntil) {
    return `Started ${formatter.format(new Date(validFrom))}`
  }

  return `${formatter.format(new Date(validFrom))} - ${formatter.format(new Date(validUntil))}`
}

export function PromotionBanner({ banner }: PromotionBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[color:var(--color-outline-variant)] bg-[color:var(--color-primary)] shadow-[0_32px_80px_rgba(0,17,58,0.22)]">
      <div className="absolute inset-0">
        <img src={banner.imageUrl} alt={banner.imageAlt} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,17,58,0.96)_18%,rgba(0,17,58,0.7)_56%,rgba(0,17,58,0.22)_100%)]" />
      </div>

      <div className="relative grid gap-10 px-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-12">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <Badge label={banner.badge} variant="inverse" />
            <span
              className={cn(
                'inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]',
                statusStyles[banner.status]
              )}
            >
              {promotionStatusLabels[banner.status]}
            </span>
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-secondary-soft)]">
            {banner.eyebrow}
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            {banner.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">{banner.description}</p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm text-white/82 backdrop-blur-md">
            <CalendarDays className="h-4 w-4" />
            {formatPromotionWindow(banner.validFrom, banner.validUntil)}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={banner.primaryCta.href}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition-all hover:-translate-y-0.5"
            >
              {banner.primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {banner.secondaryCta ? (
              <Link
                to={banner.secondaryCta.href}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/16"
              >
                {banner.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-6 backdrop-blur-md lg:p-8">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/64">Why this stands out</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">Premium booking value</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {banner.highlights.map((highlight) => (
              <div key={highlight} className="rounded-[1.25rem] bg-white/10 px-4 py-4 text-sm leading-7 text-white/82">
                {highlight}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
