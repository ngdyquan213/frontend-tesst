import { getTourCatalogSnapshot } from '@/features/tours/api/tours.api'
import { normalizeDestinationQueryParams } from '@/features/destinations/model/destination.schema'
import type {
  Destination,
  DestinationQueryParams,
  DestinationRegion,
} from '@/features/destinations/model/destination.types'

interface DestinationSeed {
  id: string
  slug: string
  name: string
  country: string
  region: DestinationRegion
  eyebrow: string
  summary: string
  description: string
  imageUrl: string
  imageAlt: string
  bestTimeLabel: string
  signatureLabel: string
  featured: boolean
  tourSearchValue: string
}

const DESTINATION_SEEDS: DestinationSeed[] = [
  {
    id: 'amalfi-coast',
    slug: 'amalfi-coast',
    name: 'Amalfi Coast',
    country: 'Italy',
    region: 'mediterranean',
    eyebrow: 'Cliffside Escape',
    summary:
      'Verified small-group sailings, polished coastal pacing, and postcard anchorages across Southern Italy.',
    description:
      'A destination for travelers who want cinematic seascapes, structured downtime, and premium support from harbor to hilltop.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCUlAAiOeRLsEjWLUpEysDqOn4nFxFXVqfWEJgz5fwyHqHmic30h-cOFQFwH8Dq6uBrAftlcvrZxLiW8IZfq_R_0Sx30G79NJn8II88covl59Q8qQEK6xHy72w9zF7TqOKoCNzYPJN0k8coe80QdWxkfD2t5D86HO_E0zCkESRXjMbo7ZqFEOuo7Mnm7EALBBemW11keI4EPuxpYv6qmsh8enqcucs9hgiw9xmsdOyt4bSTeWmvZIXdEJGziaAz0lRCV9MtFmK9W0-y',
    imageAlt:
      'Sunlit Amalfi Coast village with pastel buildings layered above deep blue Mediterranean water.',
    bestTimeLabel: 'Best from May to September',
    signatureLabel: 'Sailing routes and terrace dining',
    featured: true,
    tourSearchValue: 'Amalfi Coast',
  },
  {
    id: 'cinque-terre',
    slug: 'cinque-terre',
    name: 'Cinque Terre',
    country: 'Italy',
    region: 'mediterranean',
    eyebrow: 'Coastal Trail',
    summary:
      'Walkable villages, sea-view paths, and relaxed departures shaped for guests who want light adventure with polish.',
    description:
      'Ideal for travelers who want colorful harbors, editorial scenery, and practical logistics instead of rushed stopovers.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA9YRlTU-fr-mrFCODMLUWJbqd-rbXduL_lPQc_WGguC526SxOAn6XL5BiHrzOqjs2UhcegplxdaWIo4WA90ZYlMoDd82ToK1LWRF9gfoMq8kpKSKj16KimClz8yXO3WV7EwUdl40DDCFQC4EkpwE95cZQgAFGItFQJqYCW9RELScaBuWhmXGE89tTWsIN6ba-pSr70tIZxMTQqSWx3HG1Ihc54stGBgttskGG6PO8ZqGklluBH_b_i1mPCAkLEjXZdC8eFzHkusgDL',
    imageAlt:
      'Colorful Cinque Terre cliffside homes overlooking a bright harbor and turquoise water.',
    bestTimeLabel: 'Best from April to October',
    signatureLabel: 'Village trails and harbor stays',
    featured: false,
    tourSearchValue: 'Cinque Terre',
  },
  {
    id: 'iceland',
    slug: 'iceland',
    name: 'Iceland',
    country: 'Iceland',
    region: 'northern-europe',
    eyebrow: 'Elemental Landscapes',
    summary:
      'Published departures combine volcanic scenery, thermal rituals, and reliable road-based planning.',
    description:
      'Designed for travelers who want dramatic nature with clear structure, secure operations, and weather-smart pacing.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBsqQZAyEAySTyfrTxwslhrQPCq9YV3XCTuKaXasekBoGKSoR8Jj_FID9LWehqE2F8IWBbFvYiWF3jGJzCF1GZNVbkW8Ep-eIaXXkUNrYbAY4V2VtD9Peqke8qG1042IpwkIyLrwq-ZnqBtKxTKniHccy2KzVOdtEPcc3bip4CY71uxPYzSax3IFfVZFuG26CCaqYm7np4KnBGTvo7NDRX9xZqK45DUks7dUdekFhaoJ1e8bfqrZGGlKuq0kvNn7wdhM-kZ9KNDkLsc',
    imageAlt:
      'Powerful Icelandic waterfall cascading over dark cliffs beneath a cool grey sky.',
    bestTimeLabel: 'Best from June to September',
    signatureLabel: 'Waterfalls, geothermal pools, and ring-road scenery',
    featured: true,
    tourSearchValue: 'Iceland',
  },
  {
    id: 'baltic-capitals',
    slug: 'baltic-capitals',
    name: 'Baltic Capitals',
    country: 'Estonia, Latvia & Lithuania',
    region: 'northern-europe',
    eyebrow: 'Grand City Circuit',
    summary:
      'A refined Northern Europe edit with design-led cities, historic cores, and smoother long-haul pacing.',
    description:
      'Best for guests who want culture, architecture, and verified logistics across multiple capitals without losing the premium feel.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuByCCGNFooMVDypyWmbFtZ96sQpU-s1iVrvtH8hyHN4lyAjJ6mRITrDtrZzTVg4CKrvcR84ULL8xJWXULTPE5_F0idtPcGhS4kSnPOYJ6m2jlYR9MGJ6oPPclHCgGsoG0yTxZNVeFDnNCNE0p3r93ImC69iZnRoDQ1gaknwxx39BecQpKDHhDtqNS91e7dyBbWJabQRRJjBt_rwheCy4m5mSGcNiZHZWPCcPidOxsV3R8J-svpwQZcgb-TYQuRDiZ8txNKbc1VzrqZH',
    imageAlt:
      'Golden cathedral domes and illuminated historic buildings in a Baltic capital at blue hour.',
    bestTimeLabel: 'Best from May to September',
    signatureLabel: 'Historic centers, museums, and boutique hotels',
    featured: false,
    tourSearchValue: 'Baltic Capitals',
  },
  {
    id: 'kyoto',
    slug: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    region: 'asia-pacific',
    eyebrow: 'Temple District',
    summary:
      'Slow cultural pacing through temple neighborhoods, heritage streetscapes, and locally guided details.',
    description:
      'For travelers who prefer quiet mornings, structured discovery, and an editorial approach to cultural depth.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdJD4h6Im2zKxOobn5rx1zyrcjL1PY9yyK49sW_JWgJOGhCvx9Y2BRVuwp1u_sLHsPBuVu9XNkUuguU4ycom40O7GZImEJo_e-ggY3R-akbO5MUCtGSKK_BTGt1QEZDhaLtWLH04wiaT2IhfpKJBmC2-lYY8QjLePUExeCqDiy_KGHQsJPmqZxbgDwgqXdfpaCjYgXlZnBtF5ShW0-9-McKkv1_kpSWqZVUGGWjlrDapBTtOC-5gCAzMKCzaSsCHMxBqgvHY4NgJL1',
    imageAlt: 'Traditional Kyoto temple set against misty green mountains and layered roofs.',
    bestTimeLabel: 'Best from March to May',
    signatureLabel: 'Temple districts and heritage lanes',
    featured: true,
    tourSearchValue: 'Kyoto',
  },
  {
    id: 'bali',
    slug: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    region: 'asia-pacific',
    eyebrow: 'Wellness Journey',
    summary:
      'Rice-terrace landscapes, polished wellness pacing, and cultural moments backed by verified local delivery.',
    description:
      'A strong fit for travelers who want softness, greenery, and dependable planning without losing atmosphere.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA4MNyX3YTTYMju_j8GsHYI_rxvRe6dweJFUv-jE3mWicoWPz0TASr28C4ialWZMZxKLjMuj4FdspL7sXEsaojwac7gSjbJkwLyObStt0Jd6wlFJ0iQGlaKrvjfb3xgGl4-dBpnwnTCRMjacXq_SL2h6izdpLmMkPb_5wrvZeTbpaHrSYMfrvNRXNSoM2D2TFwDwyOVgazw7fa693IluqrRFmkNWPXsWiXcVRO4XrZyX_8ODcUvnni7k3O21SAWys2xwnE4mjcxZul9',
    imageAlt: 'Lush Balinese rice terraces in warm morning light with tropical mist in the valley.',
    bestTimeLabel: 'Best from April to October',
    signatureLabel: 'Wellness stays and cultural immersion',
    featured: true,
    tourSearchValue: 'Bali',
  },
]

function wait(duration = 420, signal?: AbortSignal) {
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

function normalizeKey(value: string) {
  return value.trim().toLowerCase()
}

function buildDestinationCatalog(): Destination[] {
  const tours = getTourCatalogSnapshot()

  return DESTINATION_SEEDS.map((seed) => {
    const relatedTours = tours.filter(
      (tour) => normalizeKey(tour.destination) === normalizeKey(seed.tourSearchValue)
    )
    const lowestPrice = relatedTours.reduce<number | null>((currentLowest, tour) => {
      if (currentLowest === null || tour.price < currentLowest) {
        return tour.price
      }

      return currentLowest
    }, null)

    return {
      ...seed,
      tourCount: relatedTours.length,
      startingPrice: lowestPrice,
      currency: relatedTours[0]?.currency ?? 'USD',
    }
  }).filter((destination) => destination.tourCount > 0)
}

function matchesQuery(destination: Destination, query?: string) {
  if (!query) {
    return true
  }

  const normalizedQuery = normalizeKey(query)
  const searchableText = [
    destination.name,
    destination.country,
    destination.summary,
    destination.description,
    destination.bestTimeLabel,
    destination.signatureLabel,
  ]
    .join(' ')
    .toLowerCase()

  return searchableText.includes(normalizedQuery)
}

function sortDestinations(destinations: Destination[]) {
  return [...destinations].sort((left, right) => {
    if (left.featured !== right.featured) {
      return Number(right.featured) - Number(left.featured)
    }

    if (left.tourCount !== right.tourCount) {
      return right.tourCount - left.tourCount
    }

    return left.name.localeCompare(right.name)
  })
}

export async function getDestinations(
  params: DestinationQueryParams = {},
  signal?: AbortSignal
): Promise<Destination[]> {
  await wait(460, signal)
  const normalizedParams = normalizeDestinationQueryParams(params)

  const filteredDestinations = buildDestinationCatalog().filter((destination) => {
    if (normalizedParams.region && destination.region !== normalizedParams.region) {
      return false
    }

    if (normalizedParams.featuredOnly && !destination.featured) {
      return false
    }

    return matchesQuery(destination, normalizedParams.query)
  })

  const sortedDestinations = sortDestinations(filteredDestinations)

  if (typeof normalizedParams.limit === 'number') {
    return sortedDestinations.slice(0, normalizedParams.limit)
  }

  return sortedDestinations
}

export const destinationsApi = {
  getDestinations,
}
