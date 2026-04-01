export type AppRole = 'guest' | 'traveler' | 'admin'
export type ThemeMode = 'light' | 'dark'
export type TourScheduleStatus = 'available' | 'almost-full' | 'sold-out'
export type BookingStatus = 'confirmed' | 'pending' | 'processing' | 'cancelled'
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed'
export type DocumentStatus = 'verified' | 'pending' | 'rejected'
export type RefundStatus = 'draft' | 'review' | 'approved' | 'paid'
export type TicketStatus = 'open' | 'waiting' | 'resolved'
export type NotificationType = 'booking' | 'document' | 'refund' | 'support'

export interface AppUser {
  id: string
  name: string
  email: string
  role: Exclude<AppRole, 'guest'>
  avatar: string
  title: string
  initials: string
  memberId: string
  location: string
}

export interface Destination {
  id: string
  slug: string
  name: string
  country: string
  headline: string
  summary: string
  image: string
  bestFor: string
  featuredTourIds: string[]
}

export interface Tour {
  id: string
  slug: string
  title: string
  location: string
  destinationId: string
  summary: string
  overview: string[]
  highlights: string[]
  itinerary: Array<{ day: number; title: string; description: string }>
  durationDays: number
  groupSize: number
  activityLevel: string
  availability: string
  priceFrom: number
  heroImage: string
  cardImage: string
  gallery: string[]
  badge?: string
  operator: string
  instantConfirmation: boolean
}

export interface TourSchedule {
  id: string
  tourId: string
  startDate: string
  endDate: string
  seatsLeft: number
  price: number
  status: TourScheduleStatus
  label: string
}

export interface Promotion {
  id: string
  slug: string
  title: string
  summary: string
  code: string
  discountLabel: string
  image: string
  validUntil: string
}

export interface Traveler {
  id: string
  fullName: string
  relation: string
  passportNumber: string
  nationality: string
  birthday: string
  isPrimary: boolean
}

export interface Booking {
  id: string
  reference: string
  tourId: string
  scheduleId: string
  travelerIds: string[]
  status: BookingStatus
  total: number
  createdAt: string
  notes: string
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'wallet'
  title: string
  description: string
  icon: string
}

export interface PaymentRecord {
  id: string
  bookingId: string
  methodId: string
  amount: number
  status: PaymentStatus
}

export interface DocumentRecord {
  id: string
  bookingId: string
  title: string
  type: string
  uploadedAt: string
  status: DocumentStatus
  notes: string
}

export interface RefundRecord {
  id: string
  bookingId: string
  amount: number
  status: RefundStatus
  reason: string
  createdAt: string
  timeline: Array<{ label: string; date: string; status: string }>
}

export interface SupportTicket {
  id: string
  reference: string
  subject: string
  fullName?: string
  email?: string
  topicId?: string
  bookingReference?: string
  bookingId?: string
  status: TicketStatus
  updatedAt: string
  messages: Array<{ from: 'user' | 'agent'; body: string; timestamp: string }>
}

export interface NotificationRecord {
  id: string
  title: string
  body: string
  type: NotificationType
  createdAt: string
  read: boolean
}

export interface Voucher {
  id: string
  bookingId: string
  title: string
  downloadLabel: string
  issuedAt: string
}

export interface PricingRule {
  id: string
  name: string
  value: string
  scope: string
}

export interface AdminTask {
  id: string
  title: string
  summary: string
  priority: 'low' | 'medium' | 'high'
  cta: string
}
