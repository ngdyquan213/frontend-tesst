import { vi } from 'vitest'
import { getPromotions } from '@/features/promotions/api/promotions.api'
import { resolvePromotionCta } from '@/features/promotions/lib/resolvePromotionCta'
import { apiClient } from '@/shared/api/apiClient'

describe('promotion ctas', () => {
  it('falls back booking links to the tours catalog', () => {
    expect(
      resolvePromotionCta({
        label: 'Book Amalfi Dates',
        href: '/tours/amalfi-coast-sailing/schedules',
        kind: 'booking',
      }),
    ).toEqual({
      label: 'Browse Eligible Tours',
      href: '/tours',
      kind: 'booking',
    })
  })

  it('preserves non-booking ctas unchanged', () => {
    expect(
      resolvePromotionCta({
        label: 'Explore Offers',
        href: '/promotions',
        kind: 'tours',
      }),
    ).toEqual({
      label: 'Explore Offers',
      href: '/promotions',
      kind: 'tours',
    })
  })

  it('serves safe booking links from the promotions catalog data', async () => {
    const getPromotionsSpy = vi.spyOn(apiClient, 'getPromotions').mockResolvedValue([
      {
        id: 'promo-1',
        category: 'seasonal',
        status: 'active',
        eyebrow: 'Seasonal',
        badge: 'Featured',
        title: 'Spring Coastline',
        offerSummary: 'Offer summary',
        description: 'Offer description',
        applicableLabel: 'Applies to coastal departures.',
        imageUrl: 'https://example.com/promo.jpg',
        imageAlt: 'Promo image',
        validFrom: '2026-03-01',
        validUntil: '2026-06-01',
        featured: true,
        primaryCta: {
          label: 'Book Amalfi Dates',
          href: '/tours/amalfi-coast-sailing/schedules',
          kind: 'booking',
        },
        secondaryCta: {
          label: 'View tours',
          href: '/tours',
          kind: 'tours',
        },
        banner: {
          id: 'banner-1',
          eyebrow: 'Banner',
          badge: 'Featured',
          title: 'Banner title',
          description: 'Banner description',
          status: 'active',
          imageUrl: 'https://example.com/banner.jpg',
          imageAlt: 'Banner image',
          validFrom: '2026-03-01',
          validUntil: '2026-06-01',
          highlights: ['Highlight'],
          primaryCta: {
            label: 'Choose departure',
            href: '/tours/amalfi-coast-sailing/schedules',
            kind: 'booking',
          },
        },
      },
    ])

    try {
      const promotions = await getPromotions()
      const bookingCtas = promotions
        .flatMap((promotion) =>
          [
            promotion.primaryCta,
            promotion.secondaryCta,
            promotion.banner?.primaryCta,
            promotion.banner?.secondaryCta,
          ].filter((cta): cta is NonNullable<typeof cta> => Boolean(cta && cta.kind === 'booking')),
        )
        .map(resolvePromotionCta)

      expect(bookingCtas.length).toBeGreaterThan(0)
      expect(bookingCtas.every((cta) => cta.href === '/tours')).toBe(true)
      expect(bookingCtas.every((cta) => cta.label === 'Browse Eligible Tours')).toBe(true)
    } finally {
      getPromotionsSpy.mockRestore()
    }
  })
})
