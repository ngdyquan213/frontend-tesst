import type { AxiosInstance } from 'axios'
import {
  normalizeBooking,
  normalizeFlight,
  normalizeHotel,
  normalizePaginatedItems,
  normalizeTour,
  toNumber,
} from '@/shared/api/apiNormalizers'
import type * as types from '@/shared/types/api'

export function createTravelBookingsApi(client: AxiosInstance) {
  function buildIdempotencyHeaders() {
    const requestId =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

    return {
      'Idempotency-Key': `booking-${requestId}`,
    }
  }

  return {
    async searchFlights(params: types.FlightSearchParams): Promise<types.FlightSearchResponse> {
      const pageSize = params.limit ?? 20
      const response = await client.get('/flights', {
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
    },

    async getFlightById(id: string): Promise<types.Flight> {
      const response = await client.get(`/flights/${id}`)
      return normalizeFlight(response.data)
    },

    async searchHotels(params: types.HotelSearchParams): Promise<types.HotelSearchResponse> {
      const pageSize = params.limit ?? 20
      const response = await client.get('/hotels', {
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
    },

    async getHotelById(id: string): Promise<types.Hotel> {
      const response = await client.get(`/hotels/${id}`)
      return normalizeHotel(response.data)
    },

    async searchTours(params: types.TourSearchParams): Promise<types.TourSearchResponse> {
      const response = await client.get('/tours', {
        params: {
          destination: params.destination,
          duration: params.duration,
          group_size: params.groupSize,
          price_range: params.priceRange,
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
    },

    async getTourById(id: string): Promise<types.Tour> {
      const response = await client.get(`/tours/${id}`)
      return normalizeTour(response.data)
    },

    async createBooking(data: types.CreateBookingRequest): Promise<types.BookingResponse> {
      const bookingType = data.booking_type.toUpperCase()
      let response

      if (bookingType === 'TOUR') {
        response = await client.post(
          '/bookings/tours',
          {
            tour_schedule_id: data.schedule_id,
            adult_count: Math.max(data.number_of_travelers, 1),
            child_count: 0,
            infant_count: 0,
          },
          {
            headers: buildIdempotencyHeaders(),
          },
        )
      } else if (bookingType === 'HOTEL') {
        const checkInDate = new Date(data.travel_date)
        const checkOutDate = new Date(checkInDate)
        checkOutDate.setDate(checkOutDate.getDate() + 1)
        response = await client.post(
          '/bookings/hotels',
          {
            hotel_room_id: data.hotel_id,
            check_in_date: data.travel_date,
            check_out_date: checkOutDate.toISOString().slice(0, 10),
            quantity: Math.max(data.number_of_travelers, 1),
          },
          {
            headers: buildIdempotencyHeaders(),
          },
        )
      } else {
        response = await client.post(
          '/bookings',
          {
            flight_id: data.flight_id,
            quantity: Math.max(data.number_of_travelers, 1),
          },
          {
            headers: buildIdempotencyHeaders(),
          },
        )
      }

      return { booking: normalizeBooking(response.data) }
    },

    async getBooking(id: string): Promise<types.BookingResponse> {
      const response = await client.get(`/bookings/${id}`)
      return { booking: normalizeBooking(response.data) }
    },

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
      const response = await client.get(`/bookings/${bookingId}/travelers`)

      return Array.isArray(response.data)
        ? response.data
            .filter(
              (item: unknown): item is Record<string, unknown> =>
                Boolean(item) && typeof item === 'object',
            )
            .map((item) => ({
              id: String(item.id ?? ''),
              booking_id: String(item.booking_id ?? bookingId),
              full_name: String(item.full_name ?? item.fullName ?? 'Traveler'),
              traveler_type: String(item.traveler_type ?? 'adult').toUpperCase(),
              date_of_birth:
                typeof item.date_of_birth === 'string' ? item.date_of_birth : undefined,
              passport_number:
                typeof item.passport_number === 'string' ? item.passport_number : undefined,
              nationality:
                typeof item.nationality === 'string' ? item.nationality : undefined,
              document_type:
                typeof item.document_type === 'string' ? item.document_type : undefined,
            }))
        : []
    },

    async getUserBookings(limit = 10, offset = 0): Promise<{
      bookings: types.Booking[]
      total: number
    }> {
      const response = await client.get('/bookings', {
        params: { page: Math.floor(offset / limit) + 1, page_size: limit },
      })
      return {
        bookings: normalizePaginatedItems(response.data, 'bookings', normalizeBooking),
        total: toNumber(response.data.total),
      }
    },

    async cancelBooking(id: string): Promise<void> {
      await client.post(`/bookings/${id}/cancel`, {})
    },
  }
}
