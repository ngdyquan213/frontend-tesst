import { apiClient } from '@/shared/api/apiClient'
import { resolveMockable } from '@/shared/api/mockApi'

function formatTravelerType(value?: string) {
  if (!value) return 'Traveler'
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const travelersApi = {
  getTravelers: async () =>
    resolveMockable({
      mock: ({ travelers }) => travelers,
      live: async () => {
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
    }),
}
