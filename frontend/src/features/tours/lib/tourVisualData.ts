import type { Tour } from '@/features/tours/model/tour.types'
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

export const ALL_TOUR_VISUALS: Tour[] = [...FEATURED_TOURS, ...TOUR_CATALOG]

function cloneTours(tours: Tour[]) {
  return tours.map((tour) => ({ ...tour }))
}

function normalizeKeyword(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function findMatchingVisualTour(apiTour: ApiTour) {
  const tourKeyword = normalizeKeyword(`${apiTour.name} ${apiTour.destination}`)

  return (
    ALL_TOUR_VISUALS.find((candidate) => {
      const candidateKeyword = normalizeKeyword(
        `${candidate.name} ${candidate.destination} ${candidate.slug}`,
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

export function getMockFeaturedToursSnapshot() {
  return cloneTours(FEATURED_TOURS)
}

export function getMockTourCatalogSnapshot() {
  return cloneTours(TOUR_CATALOG)
}
