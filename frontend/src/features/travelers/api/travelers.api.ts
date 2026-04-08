import { env } from '@/app/config/env'
import { apiClient, resolveAfter } from '@/shared/api/apiClient'
import { travelers } from '@/shared/api/mockData'

function formatTravelerType(value?: string) {
  if (!value) return 'Traveler'
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const travelersApi = {
  getTravelers: async () => {
    if (env.enableMocks) {
      return resolveAfter(travelers)
    }

    const bookingsResponse = await apiClient.getUserBookings(50, 0)
    const travelerGroups = await Promise.all(
      bookingsResponse.bookings.map(async (booking) => ({
        booking,
        travelers: await apiClient.getBookingTravelers(booking.id),
      })),
    )

    return travelerGroups.flatMap(({ booking, travelers: bookingTravelers }) =>
      bookingTravelers.map((traveler, index) => ({
        id: traveler.id,
        fullName: traveler.full_name,
        relation: `${formatTravelerType(traveler.traveler_type)} on ${booking.booking_code ?? booking.id}`,
        passportNumber: traveler.passport_number ?? 'Not provided',
        nationality: traveler.nationality ?? 'Not provided',
        birthday: traveler.date_of_birth ?? 'Not provided',
        isPrimary: index === 0,
      })),
    )
  },
  createTraveler: async (payload: { fullName: string }) => {
    if (!env.enableMocks) {
      throw new Error('Travelers are currently managed inside each booking flow, not from the account directory.')
    }

    travelers.push({
      id: `traveler-${travelers.length + 1}`,
      fullName: payload.fullName,
      relation: 'Additional traveler',
      passportNumber: 'NEW0000',
      nationality: 'TBD',
      birthday: '1995-01-01',
      isPrimary: false,
    })
    return resolveAfter(travelers)
  },
  updateTraveler: async (payload: { id: string; fullName: string }) => {
    if (!env.enableMocks) {
      throw new Error('Traveler updates are not connected on the account-level page yet.')
    }

    const traveler = travelers.find((item) => item.id === payload.id)
    if (traveler) traveler.fullName = payload.fullName
    return resolveAfter(traveler)
  },
  deleteTraveler: async (id: string) => {
    if (!env.enableMocks) {
      throw new Error(`Traveler deletion is not connected on the account-level page yet: ${id}`)
    }

    return resolveAfter(travelers.filter((traveler) => traveler.id !== id))
  },
}
