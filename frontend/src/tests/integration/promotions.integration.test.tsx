import { env } from '@/app/config/env'
import { getPromotions } from '@/features/promotions/api/promotions.api'
import { resolvePromotionCta } from '@/features/promotions/lib/resolvePromotionCta'

describe('promotion ctas', () => {
  it('falls back booking links to the tours catalog in live mode', () => {
    const previousEnableMocks = env.enableMocks
    env.enableMocks = false

    try {
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
    } finally {
      env.enableMocks = previousEnableMocks
    }
  })

  it('keeps mock booking links unchanged when mocks are enabled', () => {
    const previousEnableMocks = env.enableMocks
    env.enableMocks = true

    try {
      expect(
        resolvePromotionCta({
          label: 'Book Amalfi Dates',
          href: '/tours/amalfi-coast-sailing/schedules',
          kind: 'booking',
        }),
      ).toEqual({
        label: 'Book Amalfi Dates',
        href: '/tours/amalfi-coast-sailing/schedules',
        kind: 'booking',
      })
    } finally {
      env.enableMocks = previousEnableMocks
    }
  })

  it('serves safe booking links from the promotions catalog data', async () => {
    const previousEnableMocks = env.enableMocks
    env.enableMocks = true

    try {
      const promotions = await getPromotions()
      const bookingCtas = promotions.flatMap((promotion) =>
        [promotion.primaryCta, promotion.secondaryCta, promotion.banner?.primaryCta, promotion.banner?.secondaryCta].filter(
          (cta): cta is NonNullable<typeof cta> => Boolean(cta && cta.kind === 'booking'),
        ),
      )

      expect(bookingCtas.length).toBeGreaterThan(0)
      expect(bookingCtas.every((cta) => cta.href === '/tours')).toBe(true)
      expect(bookingCtas.every((cta) => cta.label === 'Browse Eligible Tours')).toBe(true)
    } finally {
      env.enableMocks = previousEnableMocks
    }
  })
})
