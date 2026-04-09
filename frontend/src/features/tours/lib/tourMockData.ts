import type { Tour } from '@/features/tours/model/tour.types'
import { ALL_TOUR_VISUALS } from '@/features/tours/lib/tourVisualData'
import type { Tour as ApiTour } from '@/shared/types/api'

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

const ALL_TOURS: Tour[] = [...ALL_TOUR_VISUALS]

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
      'Detailed joining instructions, traveler notes, and departure-specific preparation steps are included with the final pre-departure documents.',
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

  return `${tour.summary}\n\nThis itinerary is presented as a premium travel experience with clear pacing, polished logistics, and reservation details that stay consistent from discovery through checkout.`
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
  const schedules = buildMockSchedules(tour, override?.scheduleSeeds ?? buildDefaultScheduleSeeds(tour, index))

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

export function getMockTourDetailById(id: string) {
  const match = MOCK_TOUR_DETAILS.find((tour) => tour.id === id)
  return match ? cloneTourDetail(match) : null
}
