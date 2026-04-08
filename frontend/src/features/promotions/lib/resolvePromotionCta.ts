import { env } from '@/app/config/env'
import type { PromotionCta } from '@/features/promotions/model/promotion.types'

export function resolvePromotionCta(cta: PromotionCta): PromotionCta {
  if (env.enableMocks || cta.kind !== 'booking') {
    return cta
  }

  return {
    ...cta,
    href: cta.liveHref ?? '/tours',
    label: cta.liveLabel ?? 'Browse Eligible Tours',
  }
}
