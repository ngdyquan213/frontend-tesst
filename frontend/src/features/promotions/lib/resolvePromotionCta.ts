import type { PromotionCta } from '@/features/promotions/model/promotion.types'
import { isMockApiEnabled } from '@/shared/api/mockMode'

export function resolvePromotionCta(cta: PromotionCta): PromotionCta {
  if (isMockApiEnabled() || cta.kind !== 'booking') {
    return cta
  }

  return {
    ...cta,
    href: cta.liveHref ?? '/tours',
    label: cta.liveLabel ?? 'Browse Eligible Tours',
  }
}
