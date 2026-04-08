// export interface ApiResponse<T> {
//   data: T
//   message?: string
// }

// export interface ApiErrorShape {
//   message: string
//   code?: string
// }

// Auth Types
export type UserRole = 'traveler' | 'admin' | 'super_admin' | string

export interface User {
  id: string
  email: string
  name: string
  full_name?: string
  username?: string
  status?: string
  email_verified?: boolean
  role?: UserRole
  roles: UserRole[]
  permissions: string[]
  date_of_birth?: string
  nationality?: string
  passport_number?: string
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user?: User
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in?: number
}

export interface TokenRefreshResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in?: number
}

export interface NotificationItemResponse {
  id: string
  title: string
  body: string
  type: 'booking' | 'document' | 'refund' | 'support'
  created_at: string
  read: boolean
}

export interface NotificationListResponse {
  items: NotificationItemResponse[]
}

// Flight Types
export interface Flight {
  id: string
  airline: string
  flight_number: string
  departure_airport: string
  arrival_airport: string
  departure_time: string
  arrival_time: string
  duration: number
  available_seats: number
  price: number
  aircraft_type: string
  created_at: string
}

export interface FlightSearchParams {
  departure_airport: string
  arrival_airport: string
  departure_date: string
  return_date?: string
  passenger_count: number
  limit?: number
  offset?: number
}

export interface FlightSearchResponse {
  flights: Flight[]
  total: number
  limit: number
  offset: number
}

// Hotel Types
export interface Hotel {
  id: string
  name: string
  location: string
  city: string
  country: string
  rating: number
  price_per_night: number
  available_rooms: number
  amenities: string[]
  description: string
  created_at: string
}

export interface HotelSearchParams {
  city: string
  check_in_date: string
  check_out_date: string
  room_count: number
  limit?: number
  offset?: number
}

export interface HotelSearchResponse {
  hotels: Hotel[]
  total: number
  limit: number
  offset: number
}

// Tour Types
export interface Tour {
  id: string
  code?: string
  name: string
  destination: string
  description: string
  duration_days: number
  duration_nights?: number
  meeting_point?: string
  tour_type?: string
  status?: string
  price?: number
  available_slots?: number
  start_date?: string
  end_date?: string
  activities?: string[]
  created_at?: string
  schedules?: Array<{
    id: string
    departure_date: string
    return_date: string
    capacity: number
    available_slots: number
    status: string
    price_rules?: Array<{
      id: string
      traveler_type: string
      price: number
      currency: string
    }>
  }>
  itineraries?: Array<{
    id: string
    day_number: number
    title: string
    description?: string
  }>
  policies?: Array<{
    id: string
    cancellation_policy?: string
    refund_policy?: string
    notes?: string
  }>
}

export interface TourSearchParams {
  destination?: string
  limit?: number
  offset?: number
}

export interface TourSearchResponse {
  tours: Tour[]
  total: number
  limit: number
  offset: number
}

// Booking Types
export type BookingType = 'FLIGHT' | 'HOTEL' | 'TOUR' | 'TRAVEL' | string
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | string

export interface Booking {
  id: string
  user_id: string
  booking_code?: string
  booking_type: BookingType
  status?: BookingStatus
  flight_id?: string
  hotel_id?: string
  tour_id?: string
  schedule_id?: string
  booking_status: BookingStatus
  total_base_amount?: number
  total_discount_amount?: number
  total_final_amount?: number
  total_price: number
  currency?: string
  booking_date: string
  travel_date: string
  number_of_travelers: number
  payment_status: string
  booked_at?: string
  created_at: string
  updated_at: string
}

export interface CreateBookingRequest {
  booking_type: BookingType
  flight_id?: string
  hotel_id?: string
  tour_id?: string
  schedule_id?: string
  number_of_travelers: number
  travel_date: string
  special_requests?: string
}

export interface BookingResponse {
  booking: Booking
}

// Payment Types
export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'AUTHORIZED'
  | 'PAID'
  | 'REFUNDED'

export interface Payment {
  id: string
  booking_id: string
  amount: number
  currency: string
  status?: PaymentStatus
  payment_status: PaymentStatus
  payment_method?: string
  transaction_id?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

export interface InitiatePaymentRequest {
  booking_id: string
  payment_method: string
  idempotency_key: string
}

export interface InitiatePaymentResponse {
  payment_id: string
  booking_id: string
  amount: number
  payment_status: PaymentStatus
  payment_url?: string
  created_at: string
}

export interface RefundTimelineEntry {
  label: string
  date: string
  status: string
}

export interface Refund {
  id: string
  booking_id?: string
  amount: number
  currency?: string
  status: string
  reason?: string
  created_at: string
  updated_at?: string
  timeline?: RefundTimelineEntry[]
}

export interface SupportTicketReply {
  id: string
  author_name: string
  author_role: string
  message: string
  created_at: string
}

export interface SupportTicket {
  id: string
  reference: string
  topic_id: string
  subject: string
  requester_name: string
  requester_email: string
  booking_reference?: string
  status: string
  message_preview: string
  created_at: string
  updated_at: string
}

export interface SupportTicketDetail extends SupportTicket {
  message: string
  replies: SupportTicketReply[]
}

export interface SupportTicketReplyCreateRequest {
  message: string
  status?: string
}

export interface AdminSupportTicketUpdateRequest {
  status: string
}

export interface CreateSupportTicketRequest {
  full_name: string
  email: string
  topic_id: string
  subject: string
  message: string
  booking_reference?: string
}

// Document Types
export interface Document {
  id: string
  user_id: string
  booking_id?: string
  traveler_id?: string
  document_type: string
  file_url: string
  file_name: string
  original_filename?: string
  mime_type?: string
  file_size?: number
  storage_bucket?: string
  is_private?: boolean
  upload_date: string
  uploaded_at?: string
  expiry_date?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface DocumentUploadRequest {
  document_type: string
  file: File
}

// Error Response
export interface ApiErrorResponse {
  error_code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

// Admin Types
export interface AdminStats {
  total_users: number
  total_bookings: number
  total_revenue: number
  pending_approvals: number
  document_queue?: number
}

export interface AdminUser {
  id: string
  email: string
  name: string
  is_admin: boolean
  created_at: string
}
