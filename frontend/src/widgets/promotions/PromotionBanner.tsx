import { BadgeCheck, Headphones, ShieldCheck } from 'lucide-react'
import { PromotionBanner, usePromotionsQuery } from '@/features/promotions'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

const assuranceItems = [
  {
    title: 'Secure Payments',
    subtitle: 'Encrypted checkout remains consistent across promotional and standard bookings.',
    icon: ShieldCheck,
  },
  {
    title: 'Verified Operators',
    subtitle: 'Eligible tours stay tied to vetted operators and controlled inventory releases.',
    icon: BadgeCheck,
  },
  {
    title: 'Support Access',
    subtitle: 'Need help choosing an offer? Concierge support can guide routing and timing.',
    icon: Headphones,
  },
] as const

function PromotionBannerSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-[color:var(--color-outline-variant)] bg-[color:var(--color-primary)]">
      <div className="grid gap-10 px-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-12">
        <div className="space-y-5">
          <Skeleton className="h-9 w-40 bg-white/20" />
          <Skeleton className="h-14 w-5/6 bg-white/15" />
          <Skeleton className="h-6 w-full bg-white/10" />
          <Skeleton className="h-6 w-4/5 bg-white/10" />
          <Skeleton className="h-12 w-72 bg-white/10" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-44 bg-white/10" />
            <Skeleton className="h-12 w-44 bg-white/10" />
          </div>
        </div>
        <Skeleton className="min-h-[320px] w-full bg-white/10" />
      </div>
    </div>
  )
}

export function PromotionBannerSection() {
  const { data = [], isPending, isError, error, refetch } = usePromotionsQuery({
    featuredOnly: true,
    limit: 1,
  })

  const featuredPromotion = data[0]

  return (
    <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {isPending ? (
        <PromotionBannerSkeleton />
      ) : isError ? (
        <Card className="rounded-[2rem] p-8">
          <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
            We could not load the featured promotion.
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
      ) : !featuredPromotion?.banner ? (
        <Card className="rounded-[2rem] p-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
            A featured promotion is being curated.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
            The catalog below is still available while the highlight banner is refreshed.
          </p>
        </Card>
      ) : (
        <PromotionBanner banner={featuredPromotion.banner} />
      )}

      <div className="mt-10 rounded-[2rem] bg-[color:var(--color-surface-low)] p-8">
        <div className="grid gap-6 md:grid-cols-3">
          {assuranceItems.map((item) => {
            const Icon = item.icon

            return (
              <div key={item.title} className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[color:var(--color-secondary-strong)] shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--color-primary)]">
                    {item.title}
                  </p>
                  <p className="text-sm leading-7 text-[color:var(--color-on-surface-variant)]">{item.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
