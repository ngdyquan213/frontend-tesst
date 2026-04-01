export const resolveAfter = async <T>(data: T, delay = 120) => {
  await new Promise((resolve) => setTimeout(resolve, delay))
  return data
}

import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/features/auth/model/auth.store'
import type * as types from '@/shared/types/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

function toUpperStatus(value?: string | null) {
  return value ? value.toUpperCase() : undefined
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
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
    user_id: String(raw.user_id ?? ''),
    booking_code: typeof raw.booking_code === 'string' ? raw.booking_code : undefined,
    booking_type: String(raw.booking_type ?? 'TRAVEL'),
    status: bookingStatus,
    flight_id: typeof raw.flight_id === 'string' ? raw.flight_id : undefined,
    hotel_id: typeof raw.hotel_id === 'string' ? raw.hotel_id : undefined,
    tour_id: typeof raw.tour_id === 'string' ? raw.tour_id : undefined,
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

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = useAuthStore.getState().token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          try {
            await this.refreshToken()
            const token = useAuthStore.getState().token
            originalRequest.headers.Authorization = `Bearer ${token}`
            return this.client(originalRequest)
          } catch (refreshError) {
            useAuthStore.getState().logout()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<types.AuthResponse> {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async register(email: string, password: string, name: string): Promise<types.User> {
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
    const refreshToken = localStorage.getItem('refresh_token')
    const response = await this.client.post('/auth/refresh', {
      refresh_token: refreshToken,
    })
    localStorage.setItem('access_token', response.data.access_token)
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token)
    }
    localStorage.setItem('token_type', response.data.token_type)
    useAuthStore.setState({
      token: response.data.access_token,
      refreshToken: response.data.refresh_token ?? localStorage.getItem('refresh_token'),
      isAuthenticated: true,
    })
    return response.data
  }

  async getMe(): Promise<types.User> {
    const response = await this.client.get('/users/me')
    return normalizeUser(response.data)
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) return
    await this.client.post('/auth/logout', { refresh_token: refreshToken })
  }

  async logoutAll(): Promise<void> {
    await this.client.post('/auth/logout-all')
  }

  // Flight endpoints
  async searchFlights(params: types.FlightSearchParams): Promise<types.FlightSearchResponse> {
    const response = await this.client.get('/flights/search', { params })
    return response.data
  }

  async getFlightById(id: string): Promise<types.Flight> {
    const response = await this.client.get(`/flights/${id}`)
    return response.data.flight
  }

  // Hotel endpoints
  async searchHotels(params: types.HotelSearchParams): Promise<types.HotelSearchResponse> {
    const response = await this.client.get('/hotels/search', { params })
    return response.data
  }

  async getHotelById(id: string): Promise<types.Hotel> {
    const response = await this.client.get(`/hotels/${id}`)
    return response.data.hotel
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
    const response = await this.client.post('/bookings', {
      flight_id: data.flight_id,
      quantity: data.number_of_travelers,
    })
    return { booking: normalizeBooking(response.data) }
  }

  async getBooking(id: string): Promise<types.BookingResponse> {
    const response = await this.client.get(`/bookings/${id}`)
    return { booking: normalizeBooking(response.data) }
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
    return normalizePayment(response.data.payment)
  }

  async confirmPayment(paymentId: string): Promise<types.Payment> {
    const response = await this.client.post(`/payments/${paymentId}/confirm`)
    return response.data.payment
  }

  // Document endpoints
  async uploadDocument(documentType: string, file: File): Promise<types.Document> {
    const formData = new FormData()
    formData.append('document_type', documentType.toUpperCase())
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

  async deleteDocument(id: string): Promise<void> {
    throw new Error(`Deleting documents is not supported by the current API: ${id}`)
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
      total_revenue: toNumber(response.data.revenue?.total_revenue),
      pending_approvals: Array.isArray(response.data.refund_status_counts)
        ? response.data.refund_status_counts.reduce(
            (sum: number, item: { status?: string; count?: number | string }) =>
              item.status === 'pending' ? sum + toNumber(item.count) : sum,
            0
          )
        : 0,
    }
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

  async approvePendingDocuments(): Promise<void> {
    await this.client.post('/admin/approve-documents')
  }
}

export const apiClient = new ApiClient()

