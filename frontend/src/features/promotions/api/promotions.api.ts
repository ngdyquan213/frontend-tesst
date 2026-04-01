import type { Promotion, PromotionQueryParams, PromotionStatus } from '@/features/promotions/model/promotion.types'

const PROMOTIONS: Promotion[] = [
  {
    id: 'seasonal-coastline-special',
    category: 'seasonal',
    status: 'active',
    eyebrow: 'Seasonal Access',
    badge: 'Complimentary coastal add-on',
    title: 'Seasonal Coastline Special',
    offerSummary: 'Complimentary boat excursion or chef-led tasting on selected seaside departures.',
    description:
      'Reserve a qualifying coastline itinerary before the summer window closes and add a signature destination moment without changing the pacing of your trip.',
    applicableLabel: 'Applies to Amalfi Coast, Cinque Terre, and Maldives departures.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYr6UoUXza-Rxyx5gz2FLRC6AGpbtwDLzsvIoUfoMgJydSQjyYo5CKHlUeq0AsXMK59_6pWj_RSVJXG3ecpSThDTy3R705lliyFIr9AQsx-peQ4TYWoEJLP185pw67VX3TdHN_X5eD1fj8XWWQMogzGH_CloEjV1cGmWmej-gY_zfWeIPQlf6CblQmwuY_sqdJFUCiwaQ4A7qpcgaitFHNSLS4Z8sF8NnwZJHKKL7MvRwiqtRgPVucxtjnz0Sf5yxBXdhQ5LAW4nG7',
    imageAlt: 'Sun-drenched coastline with mountains falling into a calm turquoise sea.',
    validFrom: '2026-03-01',
    validUntil: '2026-06-30',
    featured: true,
    primaryCta: {
      label: 'View Tours',
      href: '/tours',
      kind: 'tours',
    },
    secondaryCta: {
      label: 'Book Amalfi Dates',
      href: '/tours/amalfi-coast-sailing/schedules',
      kind: 'booking',
    },
    banner: {
      id: 'seasonal-coastline-banner',
      eyebrow: 'Featured Promotion',
      badge: 'Seasonal Coastline Special',
      title: 'Travel deeper into the season, with premium moments already built in.',
      description:
        'This month’s coastline collection pairs secure departures with editorial extras, from private tastings to water-level experiences that feel tailored rather than tacked on.',
      status: 'active',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCYr6UoUXza-Rxyx5gz2FLRC6AGpbtwDLzsvIoUfoMgJydSQjyYo5CKHlUeq0AsXMK59_6pWj_RSVJXG3ecpSThDTy3R705lliyFIr9AQsx-peQ4TYWoEJLP185pw67VX3TdHN_X5eD1fj8XWWQMogzGH_CloEjV1cGmWmej-gY_zfWeIPQlf6CblQmwuY_sqdJFUCiwaQ4A7qpcgaitFHNSLS4Z8sF8NnwZJHKKL7MvRwiqtRgPVucxtjnz0Sf5yxBXdhQ5LAW4nG7',
      imageAlt: 'Panoramic luxury coastline with dramatic cliffs and clear water.',
      validFrom: '2026-03-01',
      validUntil: '2026-06-30',
      highlights: [
        'Complimentary destination moment for confirmed coastal bookings.',
        'Priority inventory on editorial seaside itineraries.',
        'Direct CTA into tours or schedule selection.',
      ],
      primaryCta: {
        label: 'Explore Eligible Tours',
        href: '/tours',
        kind: 'tours',
      },
      secondaryCta: {
        label: 'Secure Summer Dates',
        href: '/tours/amalfi-coast-sailing/schedules',
        kind: 'booking',
      },
    },
  },
  {
    id: 'early-booking-confidence',
    category: 'early_booking',
    status: 'limited',
    eyebrow: 'Locked-In Planning',
    badge: 'Best 90+ days out',
    title: 'Early Booking Confidence',
    offerSummary: 'Secure rate stability and a softer reschedule path on selected alpine and long-haul departures.',
    description:
      'Designed for travelers who want premium inventory before it tightens, this offer protects lead-time decisions with concierge support and verified operator scheduling.',
    applicableLabel: 'Best fit for Switzerland, Iceland, and Baltic departures.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBBNSc_YFPUABETMaXSaaUKh1lfKsvZEk_KcVnGwwAqEUu7CTWA0XHmbILCJdkk9HFB4kDvEdFRLFgXxZ5vSREeeyT-Lp5a60Bx9rM1_LpE1EP5D9Aw7PjG0-MpouAIDoR4CI-rsq6ep4QAyuJaU-A3SwYg1XTNZ-aarMcDR-hG21N8Sy9rfNlKxJe0pJbXXrQvXu2z72fx6GHDTw4i-6m7_sBLPpjHi-CZYIrb9397miPFRlZrK-kAquszhUh4FSXdO7UxEp1l74VQ',
    imageAlt: 'Sharp alpine ridges rising above a moody blue horizon.',
    validFrom: '2026-03-15',
    validUntil: '2026-09-15',
    featured: true,
    primaryCta: {
      label: 'View Tours',
      href: '/tours',
      kind: 'tours',
    },
    secondaryCta: {
      label: 'Reserve a Departure',
      href: '/tours/switzerland-alpine-luxury/schedules',
      kind: 'booking',
    },
    banner: {
      id: 'early-booking-banner',
      eyebrow: 'Limited Window',
      badge: 'Early Booking Confidence',
      title: 'Hold the best departures while the calendar is still generous.',
      description:
        'For a short booking window, selected early reservations include locked-in positioning on premium departures and clearer flexibility if dates need to move.',
      status: 'limited',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBBNSc_YFPUABETMaXSaaUKh1lfKsvZEk_KcVnGwwAqEUu7CTWA0XHmbILCJdkk9HFB4kDvEdFRLFgXxZ5vSREeeyT-Lp5a60Bx9rM1_LpE1EP5D9Aw7PjG0-MpouAIDoR4CI-rsq6ep4QAyuJaU-A3SwYg1XTNZ-aarMcDR-hG21N8Sy9rfNlKxJe0pJbXXrQvXu2z72fx6GHDTw4i-6m7_sBLPpjHi-CZYIrb9397miPFRlZrK-kAquszhUh4FSXdO7UxEp1l74VQ',
      imageAlt: 'Dramatic alpine summit in cool light.',
      validFrom: '2026-03-15',
      validUntil: '2026-09-15',
      highlights: [
        'Ideal for 90+ day booking lead times.',
        'Limited allocations on high-demand departures.',
        'Concierge-assisted schedule changes where eligible.',
      ],
      primaryCta: {
        label: 'Review Eligible Departures',
        href: '/tours',
        kind: 'tours',
      },
      secondaryCta: {
        label: 'Book Switzerland',
        href: '/tours/switzerland-alpine-luxury/schedules',
        kind: 'booking',
      },
    },
  },
  {
    id: 'private-departure-edit',
    category: 'private_departure',
    status: 'active',
    eyebrow: 'Private Departure',
    badge: 'Concierge rooming support',
    title: 'Private Departure Edit',
    offerSummary: 'Smaller groups unlock tailored pacing, airport coordination, and elevated arrival support.',
    description:
      'For travelers booking a private departure or family-led departure, the operations team can shape rooming, transfers, and milestone moments around a single planning thread.',
    applicableLabel: 'Available for selected Vietnam, Bali, and Kyoto departures.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA4MNyX3YTTYMju_j8GsHYI_rxvRe6dweJFUv-jE3mWicoWPz0TASr28C4ialWZMZxKLjMuj4FdspL7sXEsaojwac7gSjbJkwLyObStt0Jd6wlFJ0iQGlaKrvjfb3xgGl4-dBpnwnTCRMjacXq_SL2h6izdpLmMkPb_5wrvZeTbpaHrSYMfrvNRXNSoM2D2TFwDwyOVgazw7fa693IluqrRFmkNWPXsWiXcVRO4XrZyX_8ODcUvnni7k3O21SAWys2xwnE4mjcxZul9',
    imageAlt: 'Layered tropical terraces and a quiet villa landscape in Bali.',
    validFrom: '2026-02-20',
    validUntil: '2026-12-31',
    featured: false,
    primaryCta: {
      label: 'View Tours',
      href: '/tours',
      kind: 'tours',
    },
    secondaryCta: {
      label: 'Plan Private Dates',
      href: '/tours/bali-zen-expedition/schedules',
      kind: 'booking',
    },
  },
  {
    id: 'group-escape-suite-pairing',
    category: 'group_escape',
    status: 'active',
    eyebrow: 'Group Escape',
    badge: 'Best for 3+ travelers',
    title: 'Suite Pairing for Group Escapes',
    offerSummary: 'Connected room planning and hosted dining credits for celebratory multi-room bookings.',
    description:
      'A refined option for groups that want clarity, not compromise. Selected departures include connected room pairing guidance and curated dining touches for shared milestones.',
    applicableLabel: 'Applies to selected Maldives and Baltic group departures.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7rbYF68xNNLrAi_sBZZvcxv3Zi1TPNIHTOsmyz18aBcxLii_wMrH-YPrAieTazJVzQDQ0SAk-YIomm_OXno4ofwIB-PkzS5N4olNpz8AW7CM_GCVtAUQdz19UP9SuJIjHl8Xul2xFMMzNV4PF4fokzD_YMAQ9iN3BlBxhLtWNjglpGQWnpi-IcmKh-wtJ4rAheUu5MPmdmHfuBX1Xgz2OSQV8NsrEcdUSrgAwH474TCkA',
    imageAlt: 'Luxury overwater villas in bright blue tropical water.',
    validFrom: '2026-04-01',
    validUntil: '2026-08-31',
    featured: false,
    primaryCta: {
      label: 'View Tours',
      href: '/tours',
      kind: 'tours',
    },
    secondaryCta: {
      label: 'Start Group Booking',
      href: '/tours/maldives-azure-serenity/schedules',
      kind: 'booking',
    },
  },
  {
    id: 'winter-desert-concierge',
    category: 'seasonal',
    status: 'expired',
    eyebrow: 'Editorial Archive',
    badge: 'Winter departure archive',
    title: 'Desert Concierge Recovery',
    offerSummary: 'An example of a completed seasonal offer kept visible for transparency and reference.',
    description:
      'This previous campaign paired premium desert departures with recovery credits and lounge access. It is now closed, but remains listed to keep promotion status and timing explicit.',
    applicableLabel: 'Expired offer shown for transparency on campaign windows.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBWJnVZ1Y_VDKJuWOa7ByGZxA27sUv-32Bi4yaez01Kh1hBa-jB0teLALrt2wawFOXX9EzzQt1P4xHaeEYomzrO6pMpfj1k_MvlLblA_1EKwvDtc0ESTcaV9lAcBK8YYWcYJ-4MoPmFx6TkZDFGAgU_rz9QwPW8N7c1ifEPEDgnALTHSV1pWmqi0i4XKNLzMLi8lJiIp4fvYSNIL5X_s94GGhkIwtsCpuagDig3k3QgM3b4RQFkzHgfkR46zzdqDMEWoI8LweS9H0We',
    imageAlt: 'Luxury desert camp lit under a deep evening sky.',
    validFrom: '2025-11-01',
    validUntil: '2026-01-31',
    featured: false,
    primaryCta: {
      label: 'Explore Current Tours',
      href: '/tours',
      kind: 'tours',
    },
  },
]

function wait(duration = 420, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(resolve, duration)

    const handleAbort = () => {
      window.clearTimeout(timeoutId)
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

function sortPromotions(promotions: Promotion[]) {
  const statusOrder: Record<PromotionStatus, number> = {
    limited: 0,
    active: 1,
    expired: 2,
  }

  return [...promotions].sort((left, right) => {
    if (left.featured !== right.featured) {
      return Number(right.featured) - Number(left.featured)
    }

    if (statusOrder[left.status] !== statusOrder[right.status]) {
      return statusOrder[left.status] - statusOrder[right.status]
    }

    return left.title.localeCompare(right.title)
  })
}

export async function getPromotions(
  params: PromotionQueryParams = {},
  signal?: AbortSignal
): Promise<Promotion[]> {
  await wait(420, signal)

  const filteredPromotions = PROMOTIONS.filter((promotion) => {
    if (params.category && promotion.category !== params.category) {
      return false
    }

    if (params.status && promotion.status !== params.status) {
      return false
    }

    if (params.featuredOnly && !promotion.featured) {
      return false
    }

    return true
  })

  const orderedPromotions = sortPromotions(filteredPromotions)

  if (params.limit) {
    return orderedPromotions.slice(0, params.limit)
  }

  return orderedPromotions
}

export async function getPromotionById(id: string, signal?: AbortSignal): Promise<Promotion> {
  await wait(260, signal)

  const promotion = PROMOTIONS.find((entry) => entry.id === id)

  if (!promotion) {
    throw new Error('Promotion not found.')
  }

  return promotion
}

export const promotionsApi = {
  getPromotions,
  getPromotionById,
}
