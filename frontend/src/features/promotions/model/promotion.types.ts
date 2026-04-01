export type PromotionStatus = 'active' | 'expired' | 'limited'
export type PromotionCategory = 'seasonal' | 'early_booking' | 'private_departure' | 'group_escape'
export type PromotionFilterValue = 'all' | PromotionCategory
export type PromotionActionKind = 'tours' | 'booking'

export interface PromotionCta {
  label: string
  href: string
  kind: PromotionActionKind
}

export interface PromotionBannerData {
  id: string
  eyebrow: string
  badge: string
  title: string
  description: string
  status: PromotionStatus
  imageUrl: string
  imageAlt: string
  validFrom: string
  validUntil?: string
  highlights: string[]
  primaryCta: PromotionCta
  secondaryCta?: PromotionCta
}

export interface Promotion {
  id: string
  category: PromotionCategory
  status: PromotionStatus
  eyebrow: string
  badge: string
  title: string
  offerSummary: string
  description: string
  applicableLabel: string
  imageUrl: string
  imageAlt: string
  validFrom: string
  validUntil?: string
  featured: boolean
  primaryCta: PromotionCta
  secondaryCta?: PromotionCta
  banner?: PromotionBannerData
}

export interface PromotionQueryParams {
  category?: PromotionCategory
  status?: PromotionStatus
  featuredOnly?: boolean
  limit?: number
}

export const promotionStatusLabels: Record<PromotionStatus, string> = {
  active: 'Active',
  expired: 'Expired',
  limited: 'Limited',
}

export const promotionCategoryLabels: Record<PromotionCategory, string> = {
  seasonal: 'Seasonal',
  early_booking: 'Early Booking',
  private_departure: 'Private Departure',
  group_escape: 'Group Escape',
}

export const promotionFilterOptions = [
  'all',
  'seasonal',
  'early_booking',
  'private_departure',
  'group_escape',
] as const satisfies readonly PromotionFilterValue[]
