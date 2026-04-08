// import { resolveAfter } from '@/shared/api/apiClient'
// import { destinations, tours, tourSchedules } from '@/shared/api/mockData'

// export const toursApi = {
//   getTours: async (search = '') =>
//     resolveAfter(
//       tours.filter((tour) =>
//         `${tour.title} ${tour.location} ${tour.summary}`.toLowerCase().includes(search.toLowerCase()),
//       ),
//     ),
//   getTourDetail: async (slug: string) => resolveAfter(tours.find((tour) => tour.slug === slug) ?? tours[0]),
//   getTourSchedules: async (tourId: string) =>
//     resolveAfter(tourSchedules.filter((schedule) => schedule.tourId === tourId)),
//   getDestinations: async () => resolveAfter(destinations),
// }

import { env } from '@/app/config/env'
import type { Tour, TourSearchParams } from '@/features/tours/model/tour.types'
import { normalizeTourSearchParams } from '@/features/tours/model/tour.schema'
import { apiClient } from '@/shared/api/apiClient'
import type { Tour as ApiTour } from '@/shared/types/api'

const FEATURED_TOURS: Tour[] = [
  {
    id: 'maldives-azure-serenity',
    slug: 'azure-serenity-escape',
    destination: 'Maldives',
    name: 'Azure Serenity Escape',
    summary: 'Overwater privacy, private dining, and sunset catamaran moments in the Indian Ocean.',
    durationDays: 7,
    maxGroupSize: 12,
    price: 3450,
    currency: 'USD',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7rbYF68xNNLrAi_sBZZvcxv3Zi1TPNIHTOsmyz18aBcxLii_wMrH-YPrAieTazJVzQDQ0SAk-Y3GqecH8Pz8YvTZpjd2DSwKx81PF89x4-YIomm_OXno4ofwIB-PkzS5N4olNpz8AW7M_GCVtAUQdz19UP9SuJIjHl8Xul2xFMMzNV4PF4fokzD_YMAQ9iN3BlBxhLtWNjglpGQWnpi-IcmKh-wtJ4rAheUu5MPmdmHfuBX1Xgz2OSQV8NsrEcdUSrgAwH474TCkA',
    imageAlt: 'Luxury overwater bungalow in the Maldives with clear blue water and sunny sky.',
    availability: 'available',
    featuredLabel: 'Instant Confirmation',
  },
  {
    id: 'vietnam-heritage-highlands',
    slug: 'heritage-and-highlands',
    destination: 'Vietnam',
    name: 'Heritage & Highlands',
    summary: 'A refined cultural circuit pairing ancient temples, misty mountains, and boutique stays.',
    durationDays: 10,
    maxGroupSize: 8,
    price: 2890,
    currency: 'USD',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBZnPLwt3n823e3XaKJzmegXHOD-boBE31oB-s28PnLmWinaolQdUib-xPRxxpUk4ME4nBr70UT4LAljvdFSOmNCebdO2O5DMhZDItOjZREIcNuPR_KngpqslLKGxDkVqxGnXHKEnAv6meWjTS4F3OwR56Fu7X1h1g_6YPIPzLA2BE2cW3ZvYE-EHQcw-vnAzBQq-VAwU9IZlyRy-TWKwChaPi9VO3B0qLp7dkJA67j56oT6eMUao7QLCD9saJuLa6w_ShWf9nHvvkO',
    imageAlt: 'Ancient temple in Vietnam surrounded by misty green mountains at dawn.',
    availability: 'available',
    featuredLabel: 'Instant Confirmation',
  },
  {
    id: 'switzerland-alpine-luxury',
    slug: 'alpine-luxury-summit',
    destination: 'Switzerland',
    name: 'Alpine Luxury Summit',
    summary: 'Panoramic alpine lodges, glacier rail journeys, and a five-day high-elevation reset.',
    durationDays: 5,
    maxGroupSize: 6,
    price: 4100,
    currency: 'USD',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBBNSc_YFPUABETMaXSaaUKh1lfKsvZEk_KcVnGwwAqEUu7CTWA0XHmbILCJdkk9HFB4kDvEdFRLFgXxZ5vSREeeyT-Lp5a60Bx9rM1_LpE1EP5D9Aw7PjG0-MpouAIDoR4CI-rsq6ep4QAyuJaU-A3SwYg1XTNZ-aarMcDR-hG21N8Sy9rfNlKxJe0pJbXXrQvXu2z72fx6GHDTw4i-6m7_sBLPpjHi-CZYIrb9397miPFRlZrK-kAquszhUh4FSXdO7UxEp1l74VQ',
    imageAlt: 'Snow-capped mountain peaks in the Swiss Alps under a clear blue sky.',
    availability: 'available',
    featuredLabel: 'Instant Confirmation',
  },
]

const TOUR_CATALOG: Tour[] = [
  {
    id: 'amalfi-coast-sailing',
    slug: 'amalfi-coast-sailing',
    destination: 'Amalfi Coast',
    name: 'Amalfi Coast Sailing',
    summary: 'Experience the Tyrrhenian coast with verified routes and flexible booking.',
    durationDays: 7,
    maxGroupSize: 10,
    price: 1299,
    currency: 'USD',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCUlAAiOeRLsEjWLUpEysDqOn4nFxFXVqfWEJgz5fwyHqHmic30h-cOFQFwH8Dq6uBrAftlcvrZxLiW8IZfq_R_0Sx30G79NJn8II88covl59Q8qQEK6xHy72w9zF7TqOKoCNzYPJN0k8coe80QdWxkfD2t5D86HO_E0zCkESRXjMbo7ZqFEOuo7Mnm7EALBBemW11keI4EPuxpYv6qmsh8enqcucs9hgiw9xmsdOyt4bSTeWmvZIXdEJGziaAz0lRCV9MtFmK9W0-y',
    imageAlt: 'Dramatic Amalfi Coast shoreline with vivid blue water and pastel houses at golden hour.',
    availability: 'available',
    featuredLabel: 'Instant Confirmation',
  },
  {
    id: 'kyoto-temple-trail',
    slug: 'kyoto-temple-trail',
    destination: 'Kyoto',
    name: 'Kyoto Temple Trail',
    summary: 'A structured architectural journey through historical districts with local expertise.',
    durationDays: 5,
    maxGroupSize: 8,
    price: 1850,
    currency: 'USD',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdJD4h6Im2zKxOobn5rx1zyrcjL1PY9yyK49sW_JWgJOGhCvx9Y2BRVuwp1u_sLHsPBuVu9XNkUuguU4ycom40O7GZImEJo_e-ggY3R-akbO5MUCtGSKK_BTGt1QEZDhaLtWLH04wiaT2IhfpKJBmC2-lYY8QjLePUExeCqDiy_KGHQsJPmqZxbgDwgqXdfpaCjYgXlZnBtF5ShW0-9-McKkv1_kpSWqZVUGGWjlrDapBTtOC-5gCAzMKCzaSsCHMxBqgvHY4NgJL1',
    imageAlt: 'Misty Kyoto mountains with a traditional wooden temple and layered pine trees.',
    availability: 'available',
    featuredLabel: 'Instant Confirmation',
  },
  {
    id: 'cinque-terre-escape',
    slug: 'cinque-terre-escape',
    destination: 'Cinque Terre',
    name: 'Cinque Terre Escape',
    summary: 'Standard hiking routes through coastal villages with clear itinerary value.',
    durationDays: 4,
    maxGroupSize: 12,
    price: 940,
    currency: 'USD',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA9YRlTU-fr-mrFCODMLUWJbqd-rbXduL_lPQc_WGguC526SxOAn6XL5BiHrzOqjs2UhcegplxdaWIo4WA90ZYlMoDd82ToK1LWRF9gfoMq8kpKSKj16KimClz8yXO3WV7EwUdl40DDCFQC4EkpwE95cZQgAFGItFQJqYCW9RELScaBuWhmXGE89tTWsIN6ba-pSr70tIZxMTQqSWx3HG1Ihc54stGBgttskGG6PO8ZqGklluBH_b_i1mPCAkLEjXZdC8eFzHkusgDL',
    imageAlt: 'Colorful Cinque Terre village overlooking a turquoise harbor from above.',
    availability: 'available',
    featuredLabel: 'Instant Confirmation',
  },
  {
    id: 'baltic-grandeur',
    slug: 'baltic-grandeur',
    destination: 'Baltic Capitals',
    name: 'Baltic Grandeur',
    summary: 'Verified tour of northern capitals featuring professional guidance.',
    durationDays: 12,
    maxGroupSize: 16,
    price: 3400,
    currency: 'USD',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuByCCGNFooMVDypyWmbFtZ96sQpU-s1iVrvtH8hyHN4lyAjJ6mRITrDtrZzTVg4CKrvcR84ULL8xJWXULTPE5_F0idtPcGhS4kSnPOYJ6m2jlYR9MGJ6oPPclHCgGsoG0yTxZNVeFDnNCNE0p3r93ImC69iZnRoDQ1gaknwxx39BecQpKDHhDtqNS91e7dyBbWJabQRRJjBt_rwheCy4m5mSGcNiZHZWPCcPidOxsV3R8J-svpwQZcgb-TYQuRDiZ8txNKbc1VzrqZH',
    imageAlt: 'Golden cathedral domes in a Baltic capital under a crisp blue twilight sky.',
    availability: 'limited',
    featuredLabel: 'Instant Confirmation',
  },
  {
    id: 'bali-zen-expedition',
    slug: 'bali-zen-expedition',
    destination: 'Bali',
    name: 'Bali Zen Expedition',
    summary: 'Reliable cultural immersion through rice paddies and wellness centers.',
    durationDays: 10,
    maxGroupSize: 10,
    price: 1550,
    currency: 'USD',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA4MNyX3YTTYMju_j8GsHYI_rxvRe6dweJFUv-jE3mWicoWPz0TASr28C4ialWZMZxKLjMuj4FdspL7sXEsaojwac7gSjbJkwLyObStt0Jd6wlFJ0iQGlaKrvjfb3xgGl4-dBpnwnTCRMjacXq_SL2h6izdpLmMkPb_5wrvZeTbpaHrSYMfrvNRXNSoM2D2TFwDwyOVgazw7fa693IluqrRFmkNWPXsWiXcVRO4XrZyX_8ODcUvnni7k3O21SAWys2xwnE4mjcxZul9',
    imageAlt: 'Lush green Bali rice terraces at dawn with mist over the valley.',
    availability: 'available',
    featuredLabel: 'Instant Confirmation',
  },
  {
    id: 'icelandic-elements',
    slug: 'icelandic-elements',
    destination: 'Iceland',
    name: 'Icelandic Elements',
    summary: 'Island road exploration with verified safety standards and thermal visits.',
    durationDays: 8,
    maxGroupSize: 12,
    price: 2100,
    currency: 'USD',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBsqQZAyEAySTyfrTxwslhrQPCq9YV3XCTuKaXasekBoGKSoR8Jj_FID9LWehqE2F8IWBbFvYiWF3jGJzCF1GZNVbkW8Ep-eIaXXkUNrYbAY4V2VtD9Peqke8qG1042IpwkIyLrwq-ZnqBtKxTKniHccy2KzVOdtEPcc3bip4CY71uxPYzSax3IFfVZFuG26CCaqYm7np4KnBGTvo7NDRX9xZqK45DUks7dUdekFhaoJ1e8bfqrZGGlKuq0kvNn7wdhM-kZ9KNDkLsc',
    imageAlt: 'Icelandic waterfall with black sand foreground under a moody gray sky.',
    availability: 'available',
    featuredLabel: 'Instant Confirmation',
  },
]

interface MockTourScheduleSeed {
  departureDate: string
  capacity: number
  availableSlots: number
  adultPrice: number
  childPrice?: number
  privatePrice?: number
  status?: string
}

interface MockTourContentOverride {
  code?: string
  description?: string
  meetingPoint?: string
  tourType?: string
  itinerary?: Array<{
    title: string
    description: string
  }>
  policies?: NonNullable<ApiTour['policies']>
  scheduleSeeds?: MockTourScheduleSeed[]
}

const ALL_TOURS: Tour[] = [...FEATURED_TOURS, ...TOUR_CATALOG]

const MOCK_TOUR_CONTENT_OVERRIDES: Record<string, MockTourContentOverride> = {
  'amalfi-coast-sailing': {
    code: 'TB-AMALFI-07',
    description:
      'Set sail across the Tyrrhenian coast on a polished small-group itinerary that pairs cliffside villages, calm anchorages, and premium pacing from embarkation to return.\n\nFrom Sorrento to Amalfi and Capri, every day is structured to feel scenic, secure, and spacious enough for travelers who want the beauty of the coast without the stress of self-planning.',
    meetingPoint: 'Marina Piccola, Sorrento',
    tourType: 'Luxury Sailing',
    itinerary: [
      {
        title: 'Arrival in Sorrento',
        description:
          'Meet the host team at the marina, settle in on board, and ease into the journey with a welcome aperitivo overlooking the bay.',
      },
      {
        title: 'Capri by Water',
        description:
          'Cruise past the Faraglioni formations, pause for swimming in clear coves, and enjoy time ashore for a relaxed island stroll.',
      },
      {
        title: 'Positano Panorama',
        description:
          'Sail into Positano with time for boutiques, a beach lunch, and the postcard views that define the Amalfi Coast.',
      },
      {
        title: 'Amalfi and Ravello',
        description:
          'Explore the harbor town of Amalfi and continue uphill for gardens, terraces, and wide coastal views in Ravello.',
      },
      {
        title: 'Hidden Grottos',
        description:
          'Use smaller tender access to reach tucked-away grottos and quieter swimming spots off the main route.',
      },
      {
        title: 'Slow Coastal Return',
        description:
          'Enjoy a final scenic cruising day with long lunches, sun deck downtime, and flexible swimming stops.',
      },
      {
        title: 'Disembarkation',
        description:
          'Wrap the route with a calm breakfast on board and coordinated departure support back from the marina.',
      },
    ],
    scheduleSeeds: [
      {
        departureDate: '2026-06-14',
        capacity: 12,
        availableSlots: 7,
        adultPrice: 1299,
        childPrice: 1025,
        privatePrice: 1680,
        status: 'AVAILABLE',
      },
      {
        departureDate: '2026-07-12',
        capacity: 12,
        availableSlots: 3,
        adultPrice: 1410,
        childPrice: 1130,
        privatePrice: 1795,
        status: 'LIMITED',
      },
      {
        departureDate: '2026-08-09',
        capacity: 12,
        availableSlots: 0,
        adultPrice: 1490,
        childPrice: 1190,
        privatePrice: 1860,
        status: 'SOLD_OUT',
      },
    ],
  },
  'kyoto-temple-trail': {
    code: 'TB-KYOTO-05',
    description:
      'A slower, design-aware Kyoto circuit built around temple districts, protected streetscapes, and premium local hosting.\n\nThis route is tailored for travelers who want cultural depth, quiet mornings, and clear daily structure without rushing the experience.',
    meetingPoint: 'Kyoto Station concierge lounge',
    tourType: 'Cultural Heritage',
  },
  'maldives-azure-serenity': {
    code: 'TB-MALDIVES-07',
    description:
      'An overwater reset shaped around privacy, marine light, and premium island pacing.\n\nExpect sunrise swims, secluded dining moments, and enough built-in flexibility to keep the journey feeling effortless from arrival to departure.',
    meetingPoint: 'Velana International Airport arrivals lounge',
    tourType: 'Luxury Island Escape',
  },
  'vietnam-heritage-highlands': {
    code: 'TB-VIETNAM-10',
    description:
      'A refined route through Vietnam that balances heritage, mountain air, and boutique hospitality.\n\nThe itinerary is designed for travelers who want curated movement across very different landscapes while keeping logistics tight and support visible throughout.',
    meetingPoint: 'Noi Bai Airport premium arrivals point',
    tourType: 'Cultural Expedition',
  },
  'switzerland-alpine-luxury': {
    code: 'TB-ALPS-05',
    description:
      'A high-elevation alpine reset built around iconic rail segments, polished mountain stays, and wide-view lodges.\n\nThe route keeps transitions minimal so the focus stays on scenery, rest, and the feeling of moving through the Alps without friction.',
    meetingPoint: 'Zurich HB first-class lounge',
    tourType: 'Scenic Rail Journey',
  },
  'cinque-terre-escape': {
    code: 'TB-CINQUE-04',
    meetingPoint: 'La Spezia central station',
    tourType: 'Coastal Hiking',
  },
  'baltic-grandeur': {
    code: 'TB-BALTIC-12',
    meetingPoint: 'Tallinn Old Town host hotel',
    tourType: 'Capital Circuit',
  },
  'bali-zen-expedition': {
    code: 'TB-BALI-10',
    meetingPoint: 'Ngurah Rai Airport welcome desk',
    tourType: 'Wellness Journey',
  },
  'icelandic-elements': {
    code: 'TB-ICELAND-08',
    meetingPoint: 'Reykjavik central transfer point',
    tourType: 'Nature Expedition',
  },
}

const DEFAULT_TOUR_POLICIES: NonNullable<ApiTour['policies']> = [
  {
    id: 'policy-cancellation',
    cancellation_policy:
      'Cancel up to 30 days before departure for a full refund. Within 30 days, credit can be issued for a future curated departure.',
  },
  {
    id: 'policy-refund',
    refund_policy:
      'Approved refunds are processed back to the original payment method after operational verification and schedule release checks.',
  },
  {
    id: 'policy-notes',
    notes:
      'Detailed joining instructions, traveler notes, and any departure-specific preparation steps will be attached once the bookings flow is connected.',
  },
]

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function buildTourCode(tour: Tour, index: number) {
  const explicitCode = MOCK_TOUR_CONTENT_OVERRIDES[tour.id]?.code

  if (explicitCode) {
    return explicitCode
  }

  return `TB-${tour.destination.replace(/[^a-z]/gi, '').slice(0, 6).toUpperCase()}-${String(index + 1).padStart(2, '0')}`
}

function buildDefaultDescription(tour: Tour, override?: MockTourContentOverride) {
  if (override?.description) {
    return override.description
  }

  return `${tour.summary}\n\nThis itinerary is presented as a premium travel experience with clear pacing, polished logistics, and enough structure to transition smoothly into the bookings flow once departure selection is connected.`
}

function buildDefaultItinerary(tour: Tour) {
  const dayCount = Math.max(3, Math.min(tour.durationDays, 6))

  return Array.from({ length: dayCount }, (_, index) => {
    const dayNumber = index + 1

    if (dayNumber === 1) {
      return {
        title: `Arrival in ${tour.destination}`,
        description:
          'Meet the local host team, settle into the rhythm of the journey, and begin with a calm introduction to the destination.',
      }
    }

    if (dayNumber === dayCount) {
      return {
        title: 'Departure and wrap-up',
        description:
          'Enjoy a final curated morning before onward transfers, with support designed to keep the last step of the trip seamless.',
      }
    }

    return {
      title: `${tour.destination} signature experience ${dayNumber - 1}`,
      description:
        'Move through one of the route-defining experiences with space for premium pacing, local insight, and a smoother planning rhythm than a self-managed trip.',
    }
  })
}

function buildDefaultScheduleSeeds(tour: Tour, index: number): MockTourScheduleSeed[] {
  const baseMonth = 5 + (index % 4)
  const basePrice = tour.price
  const baseCapacity = Math.max(tour.maxGroupSize, 8)

  return [
    {
      departureDate: `2026-${String(baseMonth).padStart(2, '0')}-14`,
      capacity: baseCapacity,
      availableSlots: Math.max(2, baseCapacity - 4),
      adultPrice: basePrice,
      childPrice: Math.round(basePrice * 0.82),
      privatePrice: Math.round(basePrice * 1.28),
      status: 'AVAILABLE',
    },
    {
      departureDate: `2026-${String(baseMonth + 1).padStart(2, '0')}-11`,
      capacity: baseCapacity,
      availableSlots: Math.max(1, Math.floor(baseCapacity / 3)),
      adultPrice: Math.round(basePrice * 1.08),
      childPrice: Math.round(basePrice * 0.87),
      privatePrice: Math.round(basePrice * 1.35),
      status: 'LIMITED',
    },
  ]
}

function buildMockSchedules(tour: Tour, seeds: MockTourScheduleSeed[]) {
  return seeds.map((seed, index) => ({
    id: `${tour.id}-schedule-${index + 1}`,
    departure_date: seed.departureDate,
    return_date: addDays(seed.departureDate, Math.max(tour.durationDays - 1, 1)),
    capacity: seed.capacity,
    available_slots: seed.availableSlots,
    status: seed.status ?? 'AVAILABLE',
    price_rules: [
      {
        id: `${tour.id}-schedule-${index + 1}-adult`,
        traveler_type: 'ADULT',
        price: seed.adultPrice,
        currency: tour.currency,
      },
      {
        id: `${tour.id}-schedule-${index + 1}-child`,
        traveler_type: 'CHILD',
        price: seed.childPrice ?? Math.round(seed.adultPrice * 0.82),
        currency: tour.currency,
      },
      {
        id: `${tour.id}-schedule-${index + 1}-private`,
        traveler_type: 'PRIVATE_ROOM',
        price: seed.privatePrice ?? Math.round(seed.adultPrice * 1.3),
        currency: tour.currency,
      },
    ],
  }))
}

function buildMockTourDetail(tour: Tour, index: number): ApiTour {
  const override = MOCK_TOUR_CONTENT_OVERRIDES[tour.id]
  const itineraryItems = override?.itinerary ?? buildDefaultItinerary(tour)
  const schedules = buildMockSchedules(
    tour,
    override?.scheduleSeeds ?? buildDefaultScheduleSeeds(tour, index)
  )

  return {
    id: tour.id,
    code: buildTourCode(tour, index),
    name: tour.name,
    destination: tour.destination,
    description: buildDefaultDescription(tour, override),
    duration_days: tour.durationDays,
    duration_nights: Math.max(tour.durationDays - 1, 0),
    meeting_point: override?.meetingPoint ?? `${tour.destination} welcome point`,
    tour_type: override?.tourType ?? 'Curated Escape',
    status: tour.availability === 'sold_out' ? 'SOLD_OUT' : 'AVAILABLE',
    price: tour.price,
    available_slots: schedules[0]?.available_slots,
    start_date: schedules[0]?.departure_date,
    end_date: schedules[0]?.return_date,
    activities: [],
    created_at: new Date().toISOString(),
    schedules,
    itineraries: itineraryItems.map((item, itineraryIndex) => ({
      id: `${tour.id}-itinerary-${itineraryIndex + 1}`,
      day_number: itineraryIndex + 1,
      title: item.title,
      description: item.description,
    })),
    policies: (override?.policies ?? DEFAULT_TOUR_POLICIES).map((policy, policyIndex) => ({
      id: `${tour.id}-policy-${policyIndex + 1}`,
      cancellation_policy: policy.cancellation_policy,
      refund_policy: policy.refund_policy,
      notes: policy.notes,
    })),
  }
}

const MOCK_TOUR_DETAILS: ApiTour[] = ALL_TOURS.map(buildMockTourDetail)

function cloneTours(tours: Tour[]) {
  return tours.map((tour) => ({ ...tour }))
}

function cloneTourDetail(tour: ApiTour): ApiTour {
  return {
    ...tour,
    schedules: tour.schedules?.map((schedule) => ({
      ...schedule,
      price_rules: schedule.price_rules?.map((rule) => ({ ...rule })) ?? [],
    })),
    itineraries: tour.itineraries?.map((item) => ({ ...item })) ?? [],
    policies: tour.policies?.map((policy) => ({ ...policy })) ?? [],
  }
}

function wait(duration = 450, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler)
      }
      resolve()
    }, duration)

    function abortHandler() {
      globalThis.clearTimeout(timeoutId)
      reject(new DOMException('Request aborted.', 'AbortError'))
    }

    if (!signal) {
      return
    }

    if (signal.aborted) {
      abortHandler()
      return
    }

    signal.addEventListener('abort', abortHandler, { once: true })
  })
}

function matchesDestination(tour: Tour, destination?: string) {
  if (!destination) {
    return true
  }

  const keyword = destination.trim().toLowerCase()
  const searchableText = `${tour.name} ${tour.destination} ${tour.summary}`.toLowerCase()

  return searchableText.includes(keyword)
}

function matchesDuration(tour: Tour, duration?: TourSearchParams['duration']) {
  switch (duration) {
    case 'short':
      return tour.durationDays <= 5
    case 'medium':
      return tour.durationDays >= 6 && tour.durationDays <= 9
    case 'long':
      return tour.durationDays >= 10
    default:
      return true
  }
}

function matchesGroupSize(tour: Tour, groupSize?: TourSearchParams['groupSize']) {
  switch (groupSize) {
    case 'intimate':
      return tour.maxGroupSize <= 8
    case 'shared':
      return tour.maxGroupSize >= 9 && tour.maxGroupSize <= 12
    case 'large':
      return tour.maxGroupSize >= 13
    default:
      return true
  }
}

function matchesPriceRange(tour: Tour, priceRange?: TourSearchParams['priceRange']) {
  switch (priceRange) {
    case 'under-1500':
      return tour.price < 1500
    case '1500-2500':
      return tour.price >= 1500 && tour.price <= 2500
    case '2500-plus':
      return tour.price > 2500
    default:
      return true
  }
}

function normalizeKeyword(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function findMatchingVisualTour(apiTour: ApiTour) {
  const tourKeyword = normalizeKeyword(`${apiTour.name} ${apiTour.destination}`)

  return (
    ALL_TOURS.find((candidate) => {
      const candidateKeyword = normalizeKeyword(
        `${candidate.name} ${candidate.destination} ${candidate.slug}`
      )

      return (
        candidateKeyword === tourKeyword ||
        candidateKeyword.includes(tourKeyword) ||
        tourKeyword.includes(candidateKeyword) ||
        normalizeKeyword(candidate.destination) === normalizeKeyword(apiTour.destination) ||
        normalizeKeyword(candidate.name) === normalizeKeyword(apiTour.name)
      )
    }) ?? FEATURED_TOURS[0]
  )
}

function buildTourSummary(apiTour: ApiTour) {
  const firstParagraph = apiTour.description
    .split(/\n+/)
    .map((segment) => segment.trim())
    .find(Boolean)

  if (firstParagraph) {
    return firstParagraph
  }

  return `Explore ${apiTour.destination} with a curated itinerary and verified departure planning.`
}

function getLowestLivePrice(apiTour: ApiTour) {
  const priceRules = (apiTour.schedules ?? []).flatMap((schedule) => schedule.price_rules ?? [])
  const lowestRule = priceRules.reduce<typeof priceRules[number] | null>((lowest, rule) => {
    if (!lowest || rule.price < lowest.price) {
      return rule
    }

    return lowest
  }, null)

  return {
    amount: lowestRule?.price ?? apiTour.price ?? 0,
    currency: lowestRule?.currency ?? 'USD',
  }
}

function getMaxGroupSize(apiTour: ApiTour) {
  return (apiTour.schedules ?? []).reduce((largest, schedule) => {
    return Math.max(largest, schedule.capacity)
  }, 0)
}

function getAvailability(apiTour: ApiTour): Tour['availability'] {
  const totalAvailableSlots = (apiTour.schedules ?? []).reduce((total, schedule) => {
    return total + Math.max(schedule.available_slots, 0)
  }, 0)

  if (totalAvailableSlots === 0) {
    return 'sold_out'
  }

  if (totalAvailableSlots <= 8) {
    return 'limited'
  }

  return 'available'
}

function mapApiTourToCardModel(apiTour: ApiTour): Tour {
  const visualTour = findMatchingVisualTour(apiTour)
  const lowestPrice = getLowestLivePrice(apiTour)

  return {
    id: apiTour.id,
    slug: apiTour.id,
    destination: apiTour.destination,
    name: apiTour.name,
    summary: buildTourSummary(apiTour),
    durationDays: apiTour.duration_days,
    maxGroupSize: getMaxGroupSize(apiTour) || visualTour.maxGroupSize,
    price: lowestPrice.amount,
    currency: lowestPrice.currency,
    imageUrl: visualTour.imageUrl,
    imageAlt: visualTour.imageAlt,
    availability: getAvailability(apiTour),
    featuredLabel: 'Instant Confirmation',
  }
}

function applyClientFilters(tours: Tour[], params: TourSearchParams) {
  const filteredTours = tours.filter((tour) => {
    return (
      matchesDestination(tour, params.destination) &&
      matchesDuration(tour, params.duration) &&
      matchesGroupSize(tour, params.groupSize) &&
      matchesPriceRange(tour, params.priceRange)
    )
  })

  return typeof params.limit === 'number' ? filteredTours.slice(0, params.limit) : filteredTours
}

export async function getFeaturedTours(signal?: AbortSignal): Promise<Tour[]> {
  if (!env.enableMocks) {
    const response = await apiClient.searchTours({ limit: 12, offset: 0 })
    return cloneTours(response.tours.map(mapApiTourToCardModel).slice(0, 3))
  }

  await wait(380, signal)
  return cloneTours(FEATURED_TOURS)
}

export function getTourCatalogSnapshot(): Tour[] {
  return cloneTours(TOUR_CATALOG)
}

export async function searchTours(params: TourSearchParams = {}, signal?: AbortSignal): Promise<Tour[]> {
  const normalizedParams = normalizeTourSearchParams(params)

  if (!env.enableMocks) {
    const response = await apiClient.searchTours({
      destination: normalizedParams.destination,
      limit: 100,
      offset: 0,
    })
    return cloneTours(applyClientFilters(response.tours.map(mapApiTourToCardModel), normalizedParams))
  }

  await wait(520, signal)

  return cloneTours(applyClientFilters(TOUR_CATALOG, normalizedParams))
}

export async function getTourDetailById(id: string, signal?: AbortSignal): Promise<ApiTour | null> {
  await wait(420, signal)

  const match = MOCK_TOUR_DETAILS.find((tour) => tour.id === id)

  return match ? cloneTourDetail(match) : null
}

export const toursApi = {
  getFeaturedTours,
  getTourCatalogSnapshot,
  searchTours,
  getTourDetailById,
}
