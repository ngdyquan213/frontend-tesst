import type {
  AdminTask,
  AppUser,
  Booking,
  Destination,
  DocumentRecord,
  NotificationRecord,
  PaymentMethod,
  PaymentRecord,
  PricingRule,
  Promotion,
  RefundRecord,
  SupportTicket,
  Tour,
  TourSchedule,
  Traveler,
  Voucher,
} from '@/shared/types/common'

export const users: Record<'traveler' | 'admin', AppUser> = {
  traveler: {
    id: 'user-1',
    name: 'Alexander Sterling',
    email: 'alex@travelbook.com',
    role: 'traveler',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC8NctUnY51kyN15zd5djtZ1KbskbbSpYDwO9NVMY5f6UO5k9h2WR5pCw2xPaWtt4lJlgDjAXRl9tnAaq8Dk3wdPkv1lTy2GU7M2KGeyUVjAkcBvyP2VLLldI9O243UkqEzaZt3SgIvyA3R0-Fq6cReIlH-Z6wr5fjtw_6JG-YkTcVUl9tbHjJYGrEUF1rMMYK6IOlBpMPXtsHMtSYIbuR-JgHFpAbiRrFSb-lul7G4Coe2JazW_HdpnAymQZCHa-kGq8FNSO4SgO3f',
    title: 'Account Holder',
    initials: 'AS',
    memberId: 'TB-88209',
    location: 'Zurich, Switzerland',
  },
  admin: {
    id: 'admin-1',
    name: 'Alex Rivera',
    email: 'admin@travelbook.com',
    role: 'admin',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAUswMTQ-AcgjhZRKwshF60h_-Gr_WnxoySPbhOGNjFuFBVSzP1g0KOIrencena0sXy5W6QIQnOhrF87Q4yVTI9FwP7-r7B0PmF6w0mxxgZVKSPXEnoa3KquyjzKAdA9-pLlbw47P42A52kuuXHhISXyWt43Bfi1v7vYklvpJEiPx1vbltxEtT85KrObjgzkvsXARkEy3bOqu-z3O8jWD_U0q9SziYYliAg6i7A0TFgVXEUmuxJoBSc0THQIquc6fOImu6VE-zQZw8m',
    title: 'Senior Operator',
    initials: 'AR',
    memberId: 'TB-OPS-01',
    location: 'Operations Hub',
  },
}

export const destinations: Destination[] = [
  {
    id: 'dest-amalfi',
    slug: 'amalfi-coast',
    name: 'Amalfi Coast',
    country: 'Italy',
    headline: 'Sailing routes with verified operators and coastal stays.',
    summary: 'A structured coastal itinerary through Sorrento, Capri, and Positano.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYr6UoUXza-Rxyx5gz2FLRC6AGpbtwDLzsvIoUfoMgJydSQjyYo5CKHlUeq0AsXMK59_6pWj_RSVJXG3ecpSThDTy3R705lliyFIr9AQsx-peQ4TYWoEJLP185pw67VX3TdHN_X5eD1fj8XWWQMogzGH_CloEjV1cGmWmej-gY_zfWeIPQlf6CblQmwuY_sqdJFUCiwaQ4A7qpcgaitFHNSLS4Z8sF8NnwZJHKKL7MvRwiqtRgPVucxtjnz0Sf5yxBXdhQ5LAW4nG7',
    bestFor: 'Couples, small groups, sea lovers',
    featuredTourIds: ['tour-amalfi'],
  },
  {
    id: 'dest-swiss',
    slug: 'swiss-alps',
    name: 'Swiss Alps',
    country: 'Switzerland',
    headline: 'High-altitude trails with dependable pacing and premium stays.',
    summary: 'Mountain routes designed for travelers who want clarity and comfort.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDP-fZJaYEu_x_865r4pujSq6IVkvjnOAZfyufpRZ8USN-qMXJhCo6BVNBeRIMNOR_ew_ZjlaAQITIdMc_-9DfIRcyKuItyG3dlzeDclG1Q4tiYjfKyziiWCbqk0DId6b2GS2UPMWzE3DjGI6bVcQDoJsmKkdfQduRlZWuM_te5k0jX2V0_5jfhCuWPpsLv5YPyi9TJcn5qKj-sKP9pehOB_XYapfngTTjjxvVHMVOCm0CRzJeHDWnAwTTmScS1krr_ipZQJ1sqC-0d',
    bestFor: 'Hikers, planners, premium adventurers',
    featuredTourIds: ['tour-swiss'],
  },
  {
    id: 'dest-kyoto',
    slug: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    headline: 'Architecture, temples, and quiet cultural pacing.',
    summary: 'A calm urban-cultural route with local guides and predictable logistics.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdJD4h6Im2zKxOobn5rx1zyrcjL1PY9yyK49sW_JWgJOGhCvx9Y2BRVuwp1u_sLHsPBuVu9XNkUuguU4ycom40O7GZImEJo_e-ggY3R-akbO5MUCtGSKK_BTGt1QEZDhaLtWLH04wiaT2IhfpKJBmC2-lYY8QjLePUExeCqDiy_KGHQsJPmqZxbgDwgqXdfpaCjYgXlZnBtF5ShW0-9-McKkv1_kpSWqZVUGGWjlrDapBTtOC-5gCAzMKCzaSsCHMxBqgvHY4NgJL1',
    bestFor: 'Culture-focused travelers, first-time Japan trips',
    featuredTourIds: ['tour-kyoto'],
  },
]

export const tours: Tour[] = [
  {
    id: 'tour-amalfi',
    slug: 'amalfi-coast-sailing',
    title: 'Amalfi Coast Sailing',
    location: 'Amalfi, Italy',
    destinationId: 'dest-amalfi',
    summary: 'Experience the Tyrrhenian coast with verified routes and flexible booking.',
    overview: [
      'This 7-day sailing trip follows a defined route along the Amalfi Coast.',
      'A professional crew manages navigation, onboard operations, and daily coordination.',
      'TravelBook keeps the itinerary simple, premium, and low-friction from schedule selection to voucher delivery.',
    ],
    highlights: ['Instant confirmation', 'Small group of 12', 'On-board accommodation', 'Breakfast included'],
    itinerary: [
      { day: 1, title: 'Arrival in Sorrento', description: 'Crew briefing, cabin assignment, and evening check-in.' },
      { day: 2, title: 'Capri Transit', description: 'Sail to Capri with time for swimming and short shore access.' },
      { day: 3, title: 'Positano Stop', description: 'Independent exploration of the village and beaches.' },
      { day: 4, title: 'Amalfi Town', description: 'Guided arrival window with flexible local exploration.' },
    ],
    durationDays: 7,
    groupSize: 12,
    activityLevel: 'Moderate',
    availability: 'Seasonal',
    priceFrom: 1299,
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYr6UoUXza-Rxyx5gz2FLRC6AGpbtwDLzsvIoUfoMgJydSQjyYo5CKHlUeq0AsXMK59_6pWj_RSVJXG3ecpSThDTy3R705lliyFIr9AQsx-peQ4TYWoEJLP185pw67VX3TdHN_X5eD1fj8XWWQMogzGH_CloEjV1cGmWmej-gY_zfWeIPQlf6CblQmwuY_sqdJFUCiwaQ4A7qpcgaitFHNSLS4Z8sF8NnwZJHKKL7MvRwiqtRgPVucxtjnz0Sf5yxBXdhQ5LAW4nG7',
    cardImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC8WNpSQjFr9KyqD6ZYFPOnU29MqQfMLupjd81gyobKjnNO8XsL2SugJGWNDWSBmmsPbVXJ4gGQRLasWr21Hq5D1j9U-OqFwT_2nJeA5UdKEzpsMCsXpl4aRW6N1axBvm8_rqqVPIyREhGh1FXvRtaOCJ0qF1Ut9GnZ3TP5KLSjZuzZBZ6flTfX0b02DDh6zTY_M0dv5iqRukNCjtH1hnwTEFziT4WOxEV47ebPpBSwQ_I0ccyX92Zbz3nG9i4F1hxzg0wvtHRiqGOY',
    gallery: [],
    badge: 'Instant Confirmation',
    operator: 'TravelBook Maritime',
    instantConfirmation: true,
  },
  {
    id: 'tour-swiss',
    slug: 'swiss-alps-hiking',
    title: 'Swiss Alps Hiking',
    location: 'Bernese Oberland, Switzerland',
    destinationId: 'dest-swiss',
    summary: 'Premium hiking routes with clear logistics and scenic lodge stays.',
    overview: ['Structured alpine pacing for travelers who value preparation and comfort.'],
    highlights: ['Mountain lodge stays', 'Premium rail connections', 'Guide briefing included'],
    itinerary: [{ day: 1, title: 'Arrival in Interlaken', description: 'Welcome briefing and route prep.' }],
    durationDays: 6,
    groupSize: 10,
    activityLevel: 'Active',
    availability: 'Year-round',
    priceFrom: 2450,
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDP-fZJaYEu_x_865r4pujSq6IVkvjnOAZfyufpRZ8USN-qMXJhCo6BVNBeRIMNOR_ew_ZjlaAQITIdMc_-9DfIRcyKuItyG3dlzeDclG1Q4tiYjfKyziiWCbqk0DId6b2GS2UPMWzE3DjGI6bVcQDoJsmKkdfQduRlZWuM_te5k0jX2V0_5jfhCuWPpsLv5YPyi9TJcn5qKj-sKP9pehOB_XYapfngTTjjxvVHMVOCm0CRzJeHDWnAwTTmScS1krr_ipZQJ1sqC-0d',
    cardImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDP-fZJaYEu_x_865r4pujSq6IVkvjnOAZfyufpRZ8USN-qMXJhCo6BVNBeRIMNOR_ew_ZjlaAQITIdMc_-9DfIRcyKuItyG3dlzeDclG1Q4tiYjfKyziiWCbqk0DId6b2GS2UPMWzE3DjGI6bVcQDoJsmKkdfQduRlZWuM_te5k0jX2V0_5jfhCuWPpsLv5YPyi9TJcn5qKj-sKP9pehOB_XYapfngTTjjxvVHMVOCm0CRzJeHDWnAwTTmScS1krr_ipZQJ1sqC-0d',
    gallery: [],
    badge: 'Verified Route',
    operator: 'TravelBook Alpine',
    instantConfirmation: true,
  },
  {
    id: 'tour-kyoto',
    slug: 'kyoto-temple-trail',
    title: 'Kyoto Temple Trail',
    location: 'Kyoto, Japan',
    destinationId: 'dest-kyoto',
    summary: 'A structured architectural journey with trusted local support.',
    overview: ['A calm city itinerary designed for cultural exploration without friction.'],
    highlights: ['Cultural pacing', 'Urban transfers managed', 'Flexible support'],
    itinerary: [{ day: 1, title: 'Gion Arrival', description: 'Check-in and evening orientation walk.' }],
    durationDays: 5,
    groupSize: 14,
    activityLevel: 'Easy',
    availability: 'Year-round',
    priceFrom: 1850,
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdJD4h6Im2zKxOobn5rx1zyrcjL1PY9yyK49sW_JWgJOGhCvx9Y2BRVuwp1u_sLHsPBuVu9XNkUuguU4ycom40O7GZImEJo_e-ggY3R-akbO5MUCtGSKK_BTGt1QEZDhaLtWLH04wiaT2IhfpKJBmC2-lYY8QjLePUExeCqDiy_KGHQsJPmqZxbgDwgqXdfpaCjYgXlZnBtF5ShW0-9-McKkv1_kpSWqZVUGGWjlrDapBTtOC-5gCAzMKCzaSsCHMxBqgvHY4NgJL1',
    cardImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdJD4h6Im2zKxOobn5rx1zyrcjL1PY9yyK49sW_JWgJOGhCvx9Y2BRVuwp1u_sLHsPBuVu9XNkUuguU4ycom40O7GZImEJo_e-ggY3R-akbO5MUCtGSKK_BTGt1QEZDhaLtWLH04wiaT2IhfpKJBmC2-lYY8QjLePUExeCqDiy_KGHQsJPmqZxbgDwgqXdfpaCjYgXlZnBtF5ShW0-9-McKkv1_kpSWqZVUGGWjlrDapBTtOC-5gCAzMKCzaSsCHMxBqgvHY4NgJL1',
    gallery: [],
    badge: 'Best Seller',
    operator: 'TravelBook Asia',
    instantConfirmation: true,
  },
]

export const tourSchedules: TourSchedule[] = [
  { id: 'schedule-1', tourId: 'tour-amalfi', startDate: '2026-06-12', endDate: '2026-06-19', seatsLeft: 4, price: 1299, status: 'almost-full', label: 'Summer Departure' },
  { id: 'schedule-2', tourId: 'tour-amalfi', startDate: '2026-07-03', endDate: '2026-07-10', seatsLeft: 9, price: 1390, status: 'available', label: 'Peak Season' },
  { id: 'schedule-3', tourId: 'tour-swiss', startDate: '2026-08-14', endDate: '2026-08-20', seatsLeft: 6, price: 2450, status: 'available', label: 'Alpine Window' },
  { id: 'schedule-4', tourId: 'tour-kyoto', startDate: '2026-10-10', endDate: '2026-10-15', seatsLeft: 10, price: 1850, status: 'available', label: 'Autumn Leaves' },
]

export const promotions: Promotion[] = [
  {
    id: 'promo-1',
    slug: 'summer-sailing',
    title: 'Summer Sailing Offer',
    summary: 'Save on verified coastal departures for June and July.',
    code: 'COAST10',
    discountLabel: 'Up to 10% off',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBHWJSBM7-_areHnd-yH5vlG0wXGUalbKEPW5H2Opn80lTSdeOzrcbpvGTdaTbElDa7nSULQEaCPL64ktX7T-bDfTmXPbuEPVIAuIPFFpfV0khSS339eWSazQZVFaQ-zAGCBJmH7YJm_P3Er0xlAXrT0hd6vM1IJICvhIYAyaO2EHrBpo-ICKfMvnB90Bq0GzVd4nhUG7K1pwZJnJ5udn2SpV1R9R7dXSUMSHnTZRg3-dvihRWl6U7EQ0Ea7EWp16uUgYdW7yaGl4ox',
    validUntil: '2026-07-31',
  },
  {
    id: 'promo-2',
    slug: 'alps-premium',
    title: 'Swiss Premium Upgrade',
    summary: 'Complimentary lodge upgrade for select alpine bookings.',
    code: 'ALPSPLUS',
    discountLabel: 'Room upgrade',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDP-fZJaYEu_x_865r4pujSq6IVkvjnOAZfyufpRZ8USN-qMXJhCo6BVNBeRIMNOR_ew_ZjlaAQITIdMc_-9DfIRcyKuItyG3dlzeDclG1Q4tiYjfKyziiWCbqk0DId6b2GS2UPMWzE3DjGI6bVcQDoJsmKkdfQduRlZWuM_te5k0jX2V0_5jfhCuWPpsLv5YPyi9TJcn5qKj-sKP9pehOB_XYapfngTTjjxvVHMVOCm0CRzJeHDWnAwTTmScS1krr_ipZQJ1sqC-0d',
    validUntil: '2026-08-31',
  },
]

export const travelers: Traveler[] = [
  {
    id: 'traveler-1',
    fullName: 'Alexander Sterling',
    relation: 'Lead Traveler',
    passportNumber: 'XK129320',
    nationality: 'Swiss',
    birthday: '1991-04-10',
    isPrimary: true,
  },
  {
    id: 'traveler-2',
    fullName: 'Caroline Price',
    relation: 'Companion',
    passportNumber: 'QW551002',
    nationality: 'British',
    birthday: '1993-08-21',
    isPrimary: false,
  },
]

export const bookings: Booking[] = [
  {
    id: 'booking-1',
    reference: 'BK-9021',
    tourId: 'tour-amalfi',
    scheduleId: 'schedule-1',
    travelerIds: ['traveler-1', 'traveler-2'],
    status: 'confirmed',
    total: 2598,
    createdAt: '2026-03-24',
    notes: 'Lead traveler requested marina transfer details.',
  },
  {
    id: 'booking-2',
    reference: 'BK-1139',
    tourId: 'tour-swiss',
    scheduleId: 'schedule-3',
    travelerIds: ['traveler-1'],
    status: 'processing',
    total: 2450,
    createdAt: '2026-03-18',
    notes: 'Pricing rule review in progress for premium room add-on.',
  },
]

export const paymentMethods: PaymentMethod[] = [
  { id: 'method-1', type: 'card', title: 'Credit Card', description: 'Visa, Mastercard, American Express', icon: 'credit_card' },
  { id: 'method-2', type: 'bank', title: 'Bank Transfer', description: 'For higher value bookings and company trips', icon: 'account_balance' },
  { id: 'method-3', type: 'wallet', title: 'TravelBook Wallet', description: 'Apply available credits instantly', icon: 'account_balance_wallet' },
]

export const payments: PaymentRecord[] = [
  { id: 'payment-1', bookingId: 'booking-1', methodId: 'method-1', amount: 2598, status: 'success' },
  { id: 'payment-2', bookingId: 'booking-2', methodId: 'method-2', amount: 2450, status: 'processing' },
]

export const documents: DocumentRecord[] = [
  {
    id: 'document-1',
    bookingId: 'booking-1',
    title: 'Passport Copy - Alexander Sterling',
    type: 'Passport',
    uploadedAt: '2026-03-25',
    status: 'verified',
    notes: 'Verified by operations team.',
  },
  {
    id: 'document-2',
    bookingId: 'booking-2',
    title: 'Travel Insurance Certificate',
    type: 'Insurance',
    uploadedAt: '2026-03-22',
    status: 'pending',
    notes: 'Awaiting manual review.',
  },
]

export const refunds: RefundRecord[] = [
  {
    id: 'refund-1',
    bookingId: 'booking-1',
    amount: 500,
    status: 'review',
    reason: 'Operator changed departure window.',
    createdAt: '2026-03-26',
    timeline: [
      { label: 'Request created', date: '2026-03-26', status: 'complete' },
      { label: 'Operations review', date: '2026-03-27', status: 'current' },
      { label: 'Payout', date: '2026-03-29', status: 'upcoming' },
    ],
  },
]

export const supportTickets: SupportTicket[] = [
  {
    id: 'ticket-1',
    reference: 'SR-0001',
    subject: 'Need marina transfer timing',
    bookingId: 'booking-1',
    status: 'waiting',
    updatedAt: '2026-03-28',
    messages: [
      { from: 'user', body: 'Can you confirm the pickup time from Naples?', timestamp: '2026-03-28 09:20' },
      { from: 'agent', body: 'We are confirming with the local operator and will reply shortly.', timestamp: '2026-03-28 10:05' },
    ],
  },
]

export const notifications: NotificationRecord[] = [
  {
    id: 'notification-1',
    title: 'Booking confirmed',
    body: 'Your Amalfi Coast Sailing departure is confirmed.',
    type: 'booking',
    createdAt: '2026-03-24',
    read: false,
  },
  {
    id: 'notification-2',
    title: 'Document review pending',
    body: 'Travel insurance certificate is waiting for review.',
    type: 'document',
    createdAt: '2026-03-26',
    read: true,
  },
]

export const vouchers: Voucher[] = [
  {
    id: 'voucher-1',
    bookingId: 'booking-1',
    title: 'Amalfi Coast Sailing Travel Voucher',
    downloadLabel: 'Download PDF',
    issuedAt: '2026-03-24',
  },
]

export const pricingRules: PricingRule[] = [
  { id: 'price-1', name: 'Peak season uplift', value: '+7%', scope: 'Amalfi summer schedules' },
  { id: 'price-2', name: 'Early-bird offer', value: '-5%', scope: 'Kyoto departures before Aug 31' },
]

export const adminTasks: AdminTask[] = [
  { id: 'task-1', title: 'Urgent refund review', summary: 'Amalfi Coast Sailing (BK-9021) requires manual approval.', priority: 'high', cta: 'Review' },
  { id: 'task-2', title: 'Pending document verification', summary: '7 passports uploaded for Cyclades Island Hopper.', priority: 'medium', cta: 'Verify' },
  { id: 'task-3', title: 'Schedule price sync', summary: 'Swiss Alps premium room add-ons changed this morning.', priority: 'low', cta: 'Sync' },
]

export const mockDb = {
  users,
  destinations,
  tours,
  tourSchedules,
  promotions,
  travelers,
  bookings,
  paymentMethods,
  payments,
  documents,
  refunds,
  supportTickets,
  notifications,
  vouchers,
  pricingRules,
  adminTasks,
}
