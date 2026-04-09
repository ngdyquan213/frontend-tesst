import { useAuthStore } from '@/features/auth/model/auth.store'
import type * as types from '@/shared/types/api'

function toUpperStatus(value?: string | null) {
  return value ? value.toUpperCase() : undefined
}

export function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeFlight(raw: Record<string, unknown>): types.Flight {
  const departureTime = String(raw.departure_time ?? new Date().toISOString())
  const arrivalTime = String(raw.arrival_time ?? departureTime)

  return {
    id: String(raw.id ?? ''),
    airline:
      typeof raw.airline === 'string'
        ? raw.airline
        : typeof raw.airline_name === 'string'
          ? raw.airline_name
          : typeof raw.airline_id === 'string'
            ? raw.airline_id
            : 'Unknown airline',
    flight_number: String(raw.flight_number ?? ''),
    departure_airport: String(raw.departure_airport ?? raw.departure_airport_id ?? ''),
    arrival_airport: String(raw.arrival_airport ?? raw.arrival_airport_id ?? ''),
    departure_time: departureTime,
    arrival_time: arrivalTime,
    duration: Math.max(
      0,
      Math.round((new Date(arrivalTime).getTime() - new Date(departureTime).getTime()) / (1000 * 60)),
    ),
    available_seats: toNumber(raw.available_seats),
    price: toNumber(raw.price ?? raw.base_price),
    aircraft_type:
      typeof raw.aircraft_type === 'string'
        ? raw.aircraft_type
        : typeof raw.status === 'string'
          ? raw.status.toUpperCase()
          : 'N/A',
    created_at: String(raw.created_at ?? departureTime),
  }
}

export function normalizeHotel(raw: Record<string, unknown>): types.Hotel {
  const rooms = Array.isArray(raw.rooms)
    ? raw.rooms.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : []
  const firstRoom = rooms[0]

  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    location: [raw.city, raw.country].filter((value) => typeof value === 'string' && value.length > 0).join(', '),
    city: String(raw.city ?? ''),
    country: String(raw.country ?? ''),
    rating: toNumber(raw.rating ?? raw.star_rating),
    price_per_night: toNumber(firstRoom?.base_price_per_night),
    available_rooms: rooms.reduce((total, room) => total + toNumber(room.available_rooms ?? room.total_rooms), 0),
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities.filter((item): item is string => typeof item === 'string')
      : rooms
          .map((room) => (typeof room.room_type === 'string' ? room.room_type : ''))
          .filter((value) => value.length > 0),
    description: String(raw.description ?? ''),
    created_at: String(raw.created_at ?? new Date().toISOString()),
  }
}

export function normalizeUser(raw: Record<string, unknown>): types.User {
  const role = typeof raw.role === 'string' ? raw.role : undefined
  const roles = Array.isArray(raw.roles)
    ? raw.roles.filter((item): item is string => typeof item === 'string')
    : role
      ? [role]
      : []

  return {
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? raw.full_name ?? raw.username ?? raw.email ?? 'Traveler'),
    full_name: typeof raw.full_name === 'string' ? raw.full_name : undefined,
    username: typeof raw.username === 'string' ? raw.username : undefined,
    status: toUpperStatus(typeof raw.status === 'string' ? raw.status : undefined),
    email_verified: Boolean(raw.email_verified),
    role,
    roles,
    permissions: Array.isArray(raw.permissions)
      ? raw.permissions.filter((item): item is string => typeof item === 'string')
      : [],
    date_of_birth: typeof raw.date_of_birth === 'string' ? raw.date_of_birth : undefined,
    nationality: typeof raw.nationality === 'string' ? raw.nationality : undefined,
    passport_number: typeof raw.passport_number === 'string' ? raw.passport_number : undefined,
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: String(raw.updated_at ?? raw.created_at ?? new Date().toISOString()),
  }
}

export function normalizeBooking(raw: Record<string, unknown>): types.Booking {
  const bookingStatus = toUpperStatus(
    typeof raw.booking_status === 'string' ? raw.booking_status : typeof raw.status === 'string' ? raw.status : 'pending',
  ) ?? 'PENDING'

  const bookingDate = String(raw.booking_date ?? raw.booked_at ?? raw.created_at ?? new Date().toISOString())
  const totalPrice = toNumber(raw.total_price ?? raw.total_final_amount)
  const paymentStatus = toUpperStatus(typeof raw.payment_status === 'string' ? raw.payment_status : 'pending') ?? 'PENDING'

  return {
    id: String(raw.id ?? ''),
    user_id: String(raw.user_id ?? useAuthStore.getState().user?.id ?? ''),
    booking_code: typeof raw.booking_code === 'string' ? raw.booking_code : undefined,
    booking_type: String(raw.booking_type ?? 'TRAVEL').toUpperCase(),
    status: bookingStatus,
    flight_id: typeof raw.flight_id === 'string' ? raw.flight_id : undefined,
    hotel_id: typeof raw.hotel_id === 'string' ? raw.hotel_id : undefined,
    tour_id: typeof raw.tour_id === 'string' ? raw.tour_id : undefined,
    schedule_id: typeof raw.schedule_id === 'string' ? raw.schedule_id : undefined,
    booking_status: bookingStatus,
    total_base_amount: toNumber(raw.total_base_amount),
    total_discount_amount: toNumber(raw.total_discount_amount),
    total_final_amount: toNumber(raw.total_final_amount, totalPrice),
    total_price: totalPrice,
    currency: typeof raw.currency === 'string' ? raw.currency : 'USD',
    booking_date: bookingDate,
    travel_date: String(raw.travel_date ?? bookingDate),
    number_of_travelers: toNumber(raw.number_of_travelers ?? raw.quantity, 1),
    payment_status: paymentStatus,
    booked_at: typeof raw.booked_at === 'string' ? raw.booked_at : undefined,
    created_at: String(raw.created_at ?? bookingDate),
    updated_at: String(raw.updated_at ?? raw.created_at ?? bookingDate),
  }
}

export function normalizeDocument(raw: Record<string, unknown>): types.Document {
  const uploadDate = String(raw.upload_date ?? raw.uploaded_at ?? raw.created_at ?? new Date().toISOString())

  return {
    id: String(raw.id ?? ''),
    user_id: String(raw.user_id ?? ''),
    booking_id: typeof raw.booking_id === 'string' ? raw.booking_id : undefined,
    traveler_id: typeof raw.traveler_id === 'string' ? raw.traveler_id : undefined,
    document_type: String(raw.document_type ?? 'OTHER').toUpperCase(),
    file_url: typeof raw.file_url === 'string' ? raw.file_url : '',
    file_name: String(raw.file_name ?? raw.original_filename ?? 'document'),
    original_filename: typeof raw.original_filename === 'string' ? raw.original_filename : undefined,
    mime_type: typeof raw.mime_type === 'string' ? raw.mime_type : undefined,
    file_size: typeof raw.file_size === 'number' ? raw.file_size : undefined,
    storage_bucket: typeof raw.storage_bucket === 'string' ? raw.storage_bucket : undefined,
    is_private: typeof raw.is_private === 'boolean' ? raw.is_private : undefined,
    upload_date: uploadDate,
    uploaded_at: typeof raw.uploaded_at === 'string' ? raw.uploaded_at : uploadDate,
    expiry_date: typeof raw.expiry_date === 'string' ? raw.expiry_date : undefined,
    status: (toUpperStatus(typeof raw.status === 'string' ? raw.status : 'pending') ?? 'PENDING') as types.Document['status'],
  }
}

export function normalizePayment(raw: Record<string, unknown>): types.Payment {
  const status = (
    toUpperStatus(
      typeof raw.payment_status === 'string'
        ? raw.payment_status
        : typeof raw.status === 'string'
          ? raw.status
          : 'pending',
    ) ?? 'PENDING'
  ) as types.PaymentStatus
  const timestamp = String(raw.created_at ?? raw.paid_at ?? new Date().toISOString())

  return {
    id: String(raw.id ?? ''),
    booking_id: String(raw.booking_id ?? ''),
    amount: toNumber(raw.amount),
    currency: String(raw.currency ?? 'USD'),
    status,
    payment_status: status as types.PaymentStatus,
    payment_method: typeof raw.payment_method === 'string' ? raw.payment_method : undefined,
    transaction_id: typeof raw.gateway_transaction_ref === 'string' ? raw.gateway_transaction_ref : undefined,
    paid_at: typeof raw.paid_at === 'string' ? raw.paid_at : undefined,
    created_at: timestamp,
    updated_at: String(raw.updated_at ?? timestamp),
  }
}

export function normalizeRefund(raw: Record<string, unknown>): types.Refund {
  const createdAt = String(raw.created_at ?? raw.createdAt ?? new Date().toISOString())
  const updatedAt = String(raw.updated_at ?? raw.updatedAt ?? createdAt)

  return {
    id: String(raw.id ?? ''),
    booking_id:
      typeof raw.booking_id === 'string'
        ? raw.booking_id
        : typeof raw.bookingId === 'string'
          ? raw.bookingId
          : undefined,
    amount: toNumber(raw.amount),
    currency: typeof raw.currency === 'string' ? raw.currency : undefined,
    status:
      toUpperStatus(
        typeof raw.status === 'string'
          ? raw.status
          : typeof raw.refund_status === 'string'
            ? raw.refund_status
            : 'pending',
      ) ?? 'PENDING',
    reason: typeof raw.reason === 'string' ? raw.reason : undefined,
    created_at: createdAt,
    updated_at: updatedAt,
    timeline: Array.isArray(raw.timeline)
      ? raw.timeline
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => ({
            label: String(item.label ?? 'Status update'),
            date: String(item.date ?? createdAt),
            status: String(item.status ?? 'current'),
          }))
      : undefined,
  }
}

export function normalizeSupportTicket(raw: Record<string, unknown>): types.SupportTicket {
  const createdAt = String(raw.created_at ?? new Date().toISOString())
  const updatedAt = String(raw.updated_at ?? createdAt)

  return {
    id: String(raw.id ?? ''),
    reference: String(raw.reference ?? ''),
    topic_id: String(raw.topic_id ?? ''),
    subject: String(raw.subject ?? ''),
    requester_name: String(raw.requester_name ?? ''),
    requester_email: String(raw.requester_email ?? ''),
    booking_reference:
      typeof raw.booking_reference === 'string' ? raw.booking_reference : undefined,
    status: String(raw.status ?? 'open'),
    message_preview: String(raw.message_preview ?? ''),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export function normalizeSupportTicketDetail(raw: Record<string, unknown>): types.SupportTicketDetail {
  return {
    ...normalizeSupportTicket(raw),
    message: String(raw.message ?? ''),
    replies: Array.isArray(raw.replies)
      ? raw.replies
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => ({
            id: String(item.id ?? ''),
            author_name: String(item.author_name ?? ''),
            author_role: String(item.author_role ?? 'support'),
            message: String(item.message ?? ''),
            created_at: String(item.created_at ?? new Date().toISOString()),
          }))
      : [],
  }
}

export function normalizeTour(raw: Record<string, unknown>): types.Tour {
  const schedules = Array.isArray(raw.schedules)
    ? raw.schedules
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((schedule) => ({
          id: String(schedule.id ?? ''),
          departure_date: String(schedule.departure_date ?? ''),
          return_date: String(schedule.return_date ?? ''),
          capacity: toNumber(schedule.capacity),
          available_slots: toNumber(schedule.available_slots),
          status: String(schedule.status ?? '').toUpperCase(),
          price_rules: Array.isArray(schedule.price_rules)
            ? schedule.price_rules
                .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
                .map((rule) => ({
                  id: String(rule.id ?? ''),
                  traveler_type: String(rule.traveler_type ?? '').toUpperCase(),
                  price: toNumber(rule.price),
                  currency: String(rule.currency ?? 'USD'),
                }))
            : [],
        }))
    : []

  return {
    id: String(raw.id ?? ''),
    code: typeof raw.code === 'string' ? raw.code : undefined,
    name: String(raw.name ?? 'Untitled tour'),
    destination: String(raw.destination ?? 'Unknown destination'),
    description: String(raw.description ?? ''),
    duration_days: toNumber(raw.duration_days, 1),
    duration_nights: toNumber(raw.duration_nights),
    meeting_point: typeof raw.meeting_point === 'string' ? raw.meeting_point : undefined,
    tour_type: typeof raw.tour_type === 'string' ? raw.tour_type : undefined,
    status: toUpperStatus(typeof raw.status === 'string' ? raw.status : undefined),
    price: schedules[0]?.price_rules?.[0]?.price,
    available_slots: schedules[0]?.available_slots,
    start_date: schedules[0]?.departure_date,
    end_date: schedules[0]?.return_date,
    activities: [],
    created_at: typeof raw.created_at === 'string' ? raw.created_at : undefined,
    schedules,
    itineraries: Array.isArray(raw.itineraries)
      ? raw.itineraries
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((itinerary) => ({
            id: String(itinerary.id ?? ''),
            day_number: toNumber(itinerary.day_number, 1),
            title: String(itinerary.title ?? 'Itinerary item'),
            description: typeof itinerary.description === 'string' ? itinerary.description : undefined,
          }))
      : [],
    policies: Array.isArray(raw.policies)
      ? raw.policies
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((policy) => ({
            id: String(policy.id ?? ''),
            cancellation_policy:
              typeof policy.cancellation_policy === 'string' ? policy.cancellation_policy : undefined,
            refund_policy: typeof policy.refund_policy === 'string' ? policy.refund_policy : undefined,
            notes: typeof policy.notes === 'string' ? policy.notes : undefined,
          }))
      : [],
  }
}

export function normalizePaginatedItems<T>(
  data: Record<string, unknown>,
  key: string,
  mapper: (item: Record<string, unknown>) => T,
) {
  const source = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data[key])
      ? data[key]
      : []

  return source
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map(mapper)
}

export function normalizeRecordArray<T>(
  data: unknown,
  key: string,
  mapper: (item: Record<string, unknown>) => T,
) {
  const source = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? normalizePaginatedItems(data as Record<string, unknown>, key, mapper)
      : []

  return Array.isArray(data)
    ? data
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map(mapper)
    : source
}
