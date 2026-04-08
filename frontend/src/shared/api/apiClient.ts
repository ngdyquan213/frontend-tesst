export const resolveAfter = async <T>(data: T, delay = 120) => {
  await new Promise((resolve) => setTimeout(resolve, delay))
  return data
}

import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { env } from '@/app/config/env'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { getLivePaymentMethods, mapApiPaymentMethod } from '@/shared/lib/appMappers'
import { users as mockUsers } from '@/shared/api/mockData'
import { authStorage } from '@/shared/storage/auth.storage'
import type { PaymentMethod } from '@/shared/types/common'
import type * as types from '@/shared/types/api'

const API_BASE_URL = env.apiBaseUrl
const MOCK_ACCESS_TOKEN_PREFIX = 'mock-access-token:'
const MOCK_REFRESH_TOKEN_PREFIX = 'mock-refresh-token:'
const SKIP_AUTH_REDIRECT_HEADER = 'X-Skip-Auth-Redirect'

function createMockApiUser(name: string, email: string, role: string, id: string): types.User {
  const now = new Date().toISOString()

  return {
    id,
    email,
    name,
    role,
    roles: [role],
    permissions: role === 'admin' ? ['admin:*'] : [],
    created_at: now,
    updated_at: now,
  }
}

const mockAuthUsersById = new Map<string, types.User>()
const mockAuthUsersByEmail = new Map<string, types.User>()

function seedMockAuthUsers() {
  const seededUsers = [
    createMockApiUser(
      mockUsers.traveler.name,
      mockUsers.traveler.email,
      mockUsers.traveler.role,
      mockUsers.traveler.id
    ),
    createMockApiUser(mockUsers.admin.name, mockUsers.admin.email, mockUsers.admin.role, mockUsers.admin.id),
  ]

  for (const user of seededUsers) {
    mockAuthUsersById.set(user.id, user)
    mockAuthUsersByEmail.set(user.email.toLowerCase(), user)
  }
}

seedMockAuthUsers()

function buildMockAuthResponse(user: types.User): types.AuthResponse {
  return {
    user,
    access_token: `${MOCK_ACCESS_TOKEN_PREFIX}${user.id}`,
    refresh_token: `${MOCK_REFRESH_TOKEN_PREFIX}${user.id}`,
    token_type: 'Bearer',
    expires_in: 60 * 60,
  }
}

function getMockUserIdFromToken(token: string | null | undefined, prefix: string) {
  if (!token || !token.startsWith(prefix)) {
    return null
  }

  return token.slice(prefix.length)
}

function getMockUserFromToken(token: string | null | undefined, prefix: string) {
  const userId = getMockUserIdFromToken(token, prefix)
  return userId ? mockAuthUsersById.get(userId) ?? null : null
}

function requireMockUser(token: string | null | undefined, prefix: string) {
  const user = getMockUserFromToken(token, prefix)

  if (!user) {
    throw new Error('Mock session is invalid or has expired.')
  }

  return user
}

function toUpperStatus(value?: string | null) {
  return value ? value.toUpperCase() : undefined
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeFlight(raw: Record<string, unknown>): types.Flight {
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

function normalizeHotel(raw: Record<string, unknown>): types.Hotel {
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

function normalizeUser(raw: Record<string, unknown>): types.User {
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

function normalizeBooking(raw: Record<string, unknown>): types.Booking {
  const bookingStatus = toUpperStatus(
    typeof raw.booking_status === 'string' ? raw.booking_status : typeof raw.status === 'string' ? raw.status : 'pending'
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

function normalizeDocument(raw: Record<string, unknown>): types.Document {
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

function normalizePayment(raw: Record<string, unknown>): types.Payment {
  const status = (
    toUpperStatus(
      typeof raw.payment_status === 'string'
        ? raw.payment_status
        : typeof raw.status === 'string'
          ? raw.status
          : 'pending'
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

function normalizeRefund(raw: Record<string, unknown>): types.Refund {
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
            : 'pending'
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

function normalizeSupportTicket(raw: Record<string, unknown>): types.SupportTicket {
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

function normalizeSupportTicketDetail(raw: Record<string, unknown>): types.SupportTicketDetail {
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

function normalizeTour(raw: Record<string, unknown>): types.Tour {
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

function normalizePaginatedItems<T>(
  data: Record<string, unknown>,
  key: string,
  mapper: (item: Record<string, unknown>) => T
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

function normalizeRecordArray<T>(
  data: unknown,
  key: string,
  mapper: (item: Record<string, unknown>) => T
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

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (!env.enableMocks) {
        return config
      }

      const token = useAuthStore.getState().token ?? authStorage.getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
        const isAuthRoute = originalRequest?.url?.startsWith('/auth/')
        const skipAuthRedirect = originalRequest?.headers?.[SKIP_AUTH_REDIRECT_HEADER] === 'true'

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/refresh') &&
          !isAuthRoute &&
          !skipAuthRedirect
        ) {
          originalRequest._retry = true
          try {
            await this.refreshToken()
            const token = useAuthStore.getState().token
            if (env.enableMocks && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return this.client(originalRequest)
          } catch (refreshError) {
            useAuthStore.getState().logout()
            window.location.href = '/auth/login'
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<types.AuthResponse> {
    if (env.enableMocks) {
      if (!password.trim()) {
        throw new Error('Password is required.')
      }

      const user = mockAuthUsersByEmail.get(email.trim().toLowerCase())

      if (!user) {
        throw new Error('Invalid email or password.')
      }

      return resolveAfter(buildMockAuthResponse(user))
    }

    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async register(email: string, password: string, name: string): Promise<types.User> {
    if (env.enableMocks) {
      if (!password.trim()) {
        throw new Error('Password is required.')
      }

      const normalizedEmail = email.trim().toLowerCase()

      if (mockAuthUsersByEmail.has(normalizedEmail)) {
        throw new Error('An account with this email already exists.')
      }

      const user = createMockApiUser(name.trim() || normalizedEmail, normalizedEmail, 'traveler', `user-${Date.now()}`)
      mockAuthUsersById.set(user.id, user)
      mockAuthUsersByEmail.set(normalizedEmail, user)
      return resolveAfter(user)
    }

    const username = email.split('@')[0]
    const response = await this.client.post('/auth/register', {
      email,
      password,
      username,
      full_name: name,
    })
    return normalizeUser(response.data)
  }

  async refreshToken(): Promise<types.TokenRefreshResponse> {
    if (env.enableMocks) {
      const refreshToken = authStorage.getRefreshToken()
      const user = requireMockUser(refreshToken, MOCK_REFRESH_TOKEN_PREFIX)
      const response = buildMockAuthResponse(user)
      authStorage.setAccessToken(response.access_token)
      authStorage.setRefreshToken(response.refresh_token ?? '')
      authStorage.setTokenType(response.token_type)
      useAuthStore.setState({
        token: response.access_token,
        refreshToken: response.refresh_token ?? null,
        isAuthenticated: true,
      })
      return resolveAfter(response)
    }

    const response = await this.client.post('/auth/refresh', {})
    useAuthStore.setState({
      token: null,
      refreshToken: null,
      isAuthenticated: true,
    })
    return response.data
  }

  async getMe(options?: { skipAuthRedirect?: boolean }): Promise<types.User> {
    if (env.enableMocks) {
      const token = authStorage.getAccessToken() ?? useAuthStore.getState().token
      const user = requireMockUser(token, MOCK_ACCESS_TOKEN_PREFIX)
      return resolveAfter(user)
    }

    const response = await this.client.get('/users/me', {
      headers: options?.skipAuthRedirect ? { [SKIP_AUTH_REDIRECT_HEADER]: 'true' } : undefined,
    })
    return normalizeUser(response.data)
  }

  async updateMe(payload: { full_name: string }): Promise<types.User> {
    if (env.enableMocks) {
      const token = authStorage.getAccessToken() ?? useAuthStore.getState().token
      const user = requireMockUser(token, MOCK_ACCESS_TOKEN_PREFIX)
      const nextUser = {
        ...user,
        name: payload.full_name.trim(),
        full_name: payload.full_name.trim(),
        updated_at: new Date().toISOString(),
      }
      mockAuthUsersById.set(nextUser.id, nextUser)
      mockAuthUsersByEmail.set(nextUser.email.toLowerCase(), nextUser)
      return resolveAfter(nextUser)
    }

    const response = await this.client.put('/users/me', payload)
    return normalizeUser(response.data)
  }

  async logout(): Promise<void> {
    if (env.enableMocks) {
      return
    }

    await this.client.post('/auth/logout', {})
  }

  async logoutAll(): Promise<void> {
    if (env.enableMocks) {
      return
    }

    await this.client.post('/auth/logout-all')
  }

  async changeMyPassword(payload: { current_password: string; new_password: string }): Promise<void> {
    if (env.enableMocks) {
      return
    }

    await this.client.post('/users/me/change-password', payload)
  }

  async forgotPassword(email: string): Promise<{ email: string }> {
    if (env.enableMocks) {
      return resolveAfter({ email })
    }

    await this.client.post('/auth/forgot-password', { email })
    return { email }
  }

  async resetPassword(password: string, token?: string): Promise<boolean> {
    if (env.enableMocks) {
      return resolveAfter(true)
    }

    if (!token?.trim()) {
      throw new Error('Password reset token is required.')
    }

    await this.client.post('/auth/reset-password', { token: token.trim(), password })
    return true
  }

  // Flight endpoints
  async searchFlights(params: types.FlightSearchParams): Promise<types.FlightSearchResponse> {
    const pageSize = params.limit ?? 20
    const response = await this.client.get('/flights', {
      params: {
        departure_airport_code: params.departure_airport,
        arrival_airport_code: params.arrival_airport,
        page: Math.floor((params.offset ?? 0) / pageSize) + 1,
        page_size: pageSize,
      },
    })

    return {
      flights: normalizePaginatedItems(response.data, 'flights', normalizeFlight),
      total: toNumber(response.data.total),
      limit: pageSize,
      offset: params.offset ?? 0,
    }
  }

  async getFlightById(id: string): Promise<types.Flight> {
    const response = await this.client.get(`/flights/${id}`)
    return normalizeFlight(response.data)
  }

  // Hotel endpoints
  async searchHotels(params: types.HotelSearchParams): Promise<types.HotelSearchResponse> {
    const pageSize = params.limit ?? 20
    const response = await this.client.get('/hotels', {
      params: {
        city: params.city,
        check_in_date: params.check_in_date,
        check_out_date: params.check_out_date,
        page: Math.floor((params.offset ?? 0) / pageSize) + 1,
        page_size: pageSize,
      },
    })

    return {
      hotels: normalizePaginatedItems(response.data, 'hotels', normalizeHotel),
      total: toNumber(response.data.total),
      limit: pageSize,
      offset: params.offset ?? 0,
    }
  }

  async getHotelById(id: string): Promise<types.Hotel> {
    const response = await this.client.get(`/hotels/${id}`)
    return normalizeHotel(response.data)
  }

  // Tour endpoints
  async searchTours(params: types.TourSearchParams): Promise<types.TourSearchResponse> {
    const response = await this.client.get('/tours', {
      params: {
        destination: params.destination,
        page: 1,
        page_size: params.limit ?? 12,
      },
    })

    return {
      tours: normalizePaginatedItems(response.data, 'tours', normalizeTour),
      total: toNumber(response.data.total),
      limit: params.limit ?? 12,
      offset: params.offset ?? 0,
    }
  }

  async getTourById(id: string): Promise<types.Tour> {
    const response = await this.client.get(`/tours/${id}`)
    return normalizeTour(response.data)
  }

  // Booking endpoints
  async createBooking(data: types.CreateBookingRequest): Promise<types.BookingResponse> {
    const bookingType = data.booking_type.toUpperCase()
    let response

    if (bookingType === 'TOUR') {
      response = await this.client.post('/bookings/tours', {
        tour_schedule_id: data.schedule_id,
        adult_count: Math.max(data.number_of_travelers, 1),
        child_count: 0,
        infant_count: 0,
      })
    } else if (bookingType === 'HOTEL') {
      const checkInDate = new Date(data.travel_date)
      const checkOutDate = new Date(checkInDate)
      checkOutDate.setDate(checkOutDate.getDate() + 1)
      response = await this.client.post('/bookings/hotels', {
        hotel_room_id: data.hotel_id,
        check_in_date: data.travel_date,
        check_out_date: checkOutDate.toISOString().slice(0, 10),
        quantity: Math.max(data.number_of_travelers, 1),
      })
    } else {
      response = await this.client.post('/bookings', {
        flight_id: data.flight_id,
        quantity: Math.max(data.number_of_travelers, 1),
      })
    }

    return { booking: normalizeBooking(response.data) }
  }

  async getBooking(id: string): Promise<types.BookingResponse> {
    const response = await this.client.get(`/bookings/${id}`)
    return { booking: normalizeBooking(response.data) }
  }

  async getBookingTravelers(bookingId: string): Promise<
    Array<{
      id: string
      booking_id: string
      full_name: string
      traveler_type: string
      date_of_birth?: string
      passport_number?: string
      nationality?: string
      document_type?: string
    }>
  > {
    const response = await this.client.get(`/bookings/${bookingId}/travelers`)

    return Array.isArray(response.data)
      ? response.data
          .filter((item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => ({
            id: String(item.id ?? ''),
            booking_id: String(item.booking_id ?? bookingId),
            full_name: String(item.full_name ?? item.fullName ?? 'Traveler'),
            traveler_type: String(item.traveler_type ?? 'adult').toUpperCase(),
            date_of_birth: typeof item.date_of_birth === 'string' ? item.date_of_birth : undefined,
            passport_number: typeof item.passport_number === 'string' ? item.passport_number : undefined,
            nationality: typeof item.nationality === 'string' ? item.nationality : undefined,
            document_type: typeof item.document_type === 'string' ? item.document_type : undefined,
          }))
      : []
  }

  async getUserBookings(limit = 10, offset = 0): Promise<{
    bookings: types.Booking[]
    total: number
  }> {
    const response = await this.client.get('/bookings', {
      params: { page: Math.floor(offset / limit) + 1, page_size: limit },
    })
    return {
      bookings: normalizePaginatedItems(response.data, 'bookings', normalizeBooking),
      total: toNumber(response.data.total),
    }
  }

  async cancelBooking(id: string): Promise<void> {
    await this.client.post(`/bookings/${id}/cancel`, {})
  }

  async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    if (env.enableMocks) {
      return resolveAfter(getLivePaymentMethods())
    }

    let payload: unknown[] = []

    try {
      const response = await this.client.get('/payments/methods')
      payload = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
          ? response.data.items
          : []
    } catch {
      return getLivePaymentMethods()
    }

    if (payload.length === 0) {
      return getLivePaymentMethods()
    }

    return payload
      .filter((item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map(mapApiPaymentMethod)
  }

  async createTourCheckout(data: {
    schedule_id: string
    number_of_travelers: number
    payment_method: string
    idempotency_key: string
  }): Promise<{ booking: types.Booking; payment: types.Payment }> {
    const response = await this.client.post(
      '/payments/checkout/tours',
      {
        tour_schedule_id: data.schedule_id,
        adult_count: Math.max(data.number_of_travelers, 1),
        child_count: 0,
        infant_count: 0,
        payment_method: data.payment_method,
      },
      {
        headers: {
          'Idempotency-Key': data.idempotency_key,
        },
      },
    )

    return {
      booking: normalizeBooking(response.data.booking),
      payment: normalizePayment(response.data.payment),
    }
  }

  // Payment endpoints
  async initiatePayment(
    data: types.InitiatePaymentRequest
  ): Promise<types.InitiatePaymentResponse> {
    const response = await this.client.post(
      '/payments/initiate',
      {
        booking_id: data.booking_id,
        payment_method: data.payment_method,
      },
      {
        headers: {
          'Idempotency-Key': data.idempotency_key,
        },
      }
    )

    const payment = normalizePayment(response.data)
    return {
      payment_id: payment.id,
      booking_id: payment.booking_id,
      amount: payment.amount,
      payment_status: payment.payment_status,
      created_at: payment.created_at,
    }
  }

  async getPayment(id: string): Promise<types.Payment> {
    const response = await this.client.get(`/payments/${id}`)
    return normalizePayment(response.data)
  }

  async confirmPayment(paymentId: string): Promise<types.Payment> {
    throw new Error(`Direct payment confirmation is not supported by the live API: ${paymentId}`)
  }

  async getUserRefunds(limit = 20, offset = 0): Promise<{ refunds: types.Refund[]; total: number }> {
    const response = await this.client.get('/refunds', {
      params: { page: Math.floor(offset / limit) + 1, page_size: limit },
    })

    return {
      refunds: normalizeRecordArray(response.data, 'refunds', normalizeRefund),
      total:
        response.data && typeof response.data === 'object' && 'total' in response.data
          ? toNumber((response.data as Record<string, unknown>).total)
          : 0,
    }
  }

  async getRefund(id: string): Promise<types.Refund> {
    const response = await this.client.get(`/refunds/${id}`)
    return normalizeRefund(response.data)
  }

  async createRefundRequest(payload: { reason: string; booking_id?: string }): Promise<types.Refund> {
    const response = await this.client.post('/refunds', {
      booking_id: payload.booking_id,
      reason: payload.reason,
    })
    return normalizeRefund(response.data)
  }

  async getSupportTickets(limit = 20, offset = 0): Promise<{ tickets: types.SupportTicket[]; total: number }> {
    const response = await this.client.get('/support/tickets', {
      params: { page: Math.floor(offset / limit) + 1, page_size: limit },
    })

    return {
      tickets: normalizeRecordArray(response.data, 'tickets', normalizeSupportTicket),
      total:
        response.data && typeof response.data === 'object' && 'total' in response.data
          ? toNumber((response.data as Record<string, unknown>).total)
          : 0,
    }
  }

  async getSupportTicket(id: string): Promise<types.SupportTicketDetail> {
    const response = await this.client.get(`/support/tickets/${id}`)
    return normalizeSupportTicketDetail(response.data)
  }

  async replyToSupportTicket(
    id: string,
    payload: types.SupportTicketReplyCreateRequest,
  ): Promise<types.SupportTicketDetail> {
    const response = await this.client.post(`/support/tickets/${id}/replies`, payload)
    return normalizeSupportTicketDetail(response.data)
  }

  async createSupportTicket(payload: types.CreateSupportTicketRequest): Promise<types.SupportTicket> {
    const response = await this.client.post('/support/tickets', payload)
    return normalizeSupportTicket(response.data)
  }

  async getAdminSupportTickets(
    limit = 20,
    offset = 0,
    status?: string,
  ): Promise<{ tickets: types.SupportTicket[]; total: number }> {
    const response = await this.client.get('/support/admin/tickets', {
      params: {
        page: Math.floor(offset / limit) + 1,
        page_size: limit,
        status,
      },
    })

    return {
      tickets: normalizeRecordArray(response.data, 'tickets', normalizeSupportTicket),
      total:
        response.data && typeof response.data === 'object' && 'total' in response.data
          ? toNumber((response.data as Record<string, unknown>).total)
          : 0,
    }
  }

  async getAdminSupportTicket(id: string): Promise<types.SupportTicketDetail> {
    const response = await this.client.get(`/support/admin/tickets/${id}`)
    return normalizeSupportTicketDetail(response.data)
  }

  async replyToAdminSupportTicket(
    id: string,
    payload: types.SupportTicketReplyCreateRequest,
  ): Promise<types.SupportTicketDetail> {
    const response = await this.client.post(`/support/admin/tickets/${id}/replies`, payload)
    return normalizeSupportTicketDetail(response.data)
  }

  async updateAdminSupportTicket(
    id: string,
    payload: types.AdminSupportTicketUpdateRequest,
  ): Promise<types.SupportTicketDetail> {
    const response = await this.client.put(`/support/admin/tickets/${id}`, payload)
    return normalizeSupportTicketDetail(response.data)
  }

  // Document endpoints
  async uploadDocument(documentType: string, file: File): Promise<types.Document> {
    const formData = new FormData()
    formData.append('document_type', documentType.trim().toLowerCase())
    formData.append('file', file)

    const response = await this.client.post('/uploads/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return normalizeDocument(response.data)
  }

  async getUserDocuments(): Promise<types.Document[]> {
    const response = await this.client.get('/uploads/documents')
    return Array.isArray(response.data)
      ? response.data
          .filter((item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map(normalizeDocument)
      : []
  }

  async downloadDocument(id: string): Promise<Blob> {
    const response = await this.client.get(`/uploads/documents/${id}/download`, {
      responseType: 'blob',
    })

    return response.data as Blob
  }

  async downloadVoucherPdf(bookingId: string): Promise<Blob> {
    const response = await this.client.get(`/bookings/${bookingId}/voucher.pdf`, {
      responseType: 'blob',
    })

    return response.data as Blob
  }

  // Admin endpoints
  async getAdminStats(): Promise<types.AdminStats> {
    const response = await this.client.get('/admin/dashboard/summary')

    return {
      total_users: 0,
      total_bookings: Array.isArray(response.data.booking_status_counts)
        ? response.data.booking_status_counts.reduce(
            (sum: number, item: { count?: number | string }) => sum + toNumber(item.count),
            0
          )
        : 0,
      total_revenue: toNumber(response.data.revenue?.net_revenue_amount ?? response.data.revenue?.total_paid_amount),
      pending_approvals: Array.isArray(response.data.refund_status_counts)
        ? response.data.refund_status_counts.reduce(
            (sum: number, item: { status?: string; count?: number | string }) =>
              item.status?.toLowerCase() === 'pending' ? sum + toNumber(item.count) : sum,
            0
          )
        : 0,
      document_queue: Array.isArray(response.data.recent_activities) ? response.data.recent_activities.length : 0,
    }
  }

  async getAdminDashboardSummary(recentLimit = 10): Promise<Record<string, unknown>> {
    const response = await this.client.get('/admin/dashboard/summary', {
      params: { recent_limit: recentLimit },
    })

    return response.data as Record<string, unknown>
  }

  async getAllUsers(limit = 10, offset = 0): Promise<{
    users: types.AdminUser[]
    total: number
  }> {
    const response = await this.client.get('/admin/users', {
      params: { limit, offset },
    })
    return response.data
  }

  async getAllBookings(limit = 10, offset = 0): Promise<{
    bookings: types.Booking[]
    total: number
  }> {
    const response = await this.client.get('/admin/bookings', {
      params: { page: Math.floor(offset / limit) + 1, page_size: limit },
    })
    return {
      bookings: normalizePaginatedItems(response.data, 'bookings', normalizeBooking),
      total: toNumber(response.data.total),
    }
  }

  async getAdminRefunds(limit = 20, offset = 0): Promise<{ refunds: types.Refund[]; total: number }> {
    const response = await this.client.get('/admin/refunds', {
      params: { page: Math.floor(offset / limit) + 1, page_size: limit },
    })

    return {
      refunds: normalizeRecordArray(response.data, 'refunds', normalizeRefund),
      total:
        response.data && typeof response.data === 'object' && 'total' in response.data
          ? toNumber((response.data as Record<string, unknown>).total)
          : 0,
    }
  }

  async approveRefund(id: string): Promise<types.Refund> {
    const response = await this.client.put(`/admin/refunds/${id}`, {
      status: 'processed',
      reason: 'Approved from admin dashboard',
    })
    return normalizeRefund(response.data)
  }

  async getAdminTours(limit = 50, offset = 0): Promise<{ tours: types.Tour[]; total: number }> {
    const response = await this.client.get('/admin/tours', {
      params: { page: Math.floor(offset / limit) + 1, page_size: limit },
    })

    return {
      tours: normalizePaginatedItems(response.data, 'tours', normalizeTour),
      total: toNumber(response.data.total),
    }
  }

  async createAdminTour(payload: {
    code: string
    name: string
    destination: string
    description?: string
    duration_days: number
    duration_nights: number
    meeting_point?: string
    tour_type?: string
    status: 'active' | 'inactive'
  }): Promise<types.Tour> {
    const response = await this.client.post('/admin/tours', payload)
    return normalizeTour(response.data)
  }

  async updateAdminTour(
    tourId: string,
    payload: {
      name?: string
      destination?: string
      description?: string
      duration_days?: number
      duration_nights?: number
      meeting_point?: string
      tour_type?: string
      status?: 'active' | 'inactive'
    },
  ): Promise<types.Tour> {
    const response = await this.client.put(`/admin/tours/${tourId}`, payload)
    return normalizeTour(response.data)
  }

  async getAdminCoupons(limit = 50, offset = 0): Promise<{ coupons: Record<string, unknown>[]; total: number }> {
    const response = await this.client.get('/admin/coupons', {
      params: { page: Math.floor(offset / limit) + 1, page_size: limit },
    })

    return {
      coupons: normalizePaginatedItems(response.data, 'coupons', (item) => item),
      total: toNumber(response.data.total),
    }
  }

  async updateAdminCoupon(
    couponId: string,
    payload: {
      name?: string
      discount_value?: number
      is_active?: boolean
    },
  ): Promise<Record<string, unknown>> {
    const response = await this.client.put(`/admin/coupons/${couponId}`, payload)
    return response.data as Record<string, unknown>
  }

  async getAdminDocuments(): Promise<types.Document[]> {
    const response = await this.client.get('/admin/documents')
    return Array.isArray(response.data)
      ? response.data
          .filter((item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map(normalizeDocument)
      : []
  }

  async reviewAdminDocument(documentId: string, status: 'approved' | 'rejected' = 'approved'): Promise<types.Document> {
    const response = await this.client.post(`/admin/documents/${documentId}/review`, { status })
    return normalizeDocument(response.data)
  }

  async approvePendingDocuments(): Promise<void> {
    throw new Error('Admin document approval is not supported by the current API.')
  }

  async getNotifications(): Promise<types.NotificationListResponse> {
    const response = await this.client.get('/notifications')
    return response.data
  }

  async markNotificationRead(notificationId: string): Promise<types.NotificationItemResponse> {
    const response = await this.client.post(`/notifications/${notificationId}/read`)
    return response.data
  }

  async markAllNotificationsRead(): Promise<types.NotificationListResponse> {
    const response = await this.client.post('/notifications/read-all')
    return response.data
  }
}

export const apiClient = new ApiClient()
