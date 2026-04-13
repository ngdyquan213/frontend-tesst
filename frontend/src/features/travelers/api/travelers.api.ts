import { apiClient } from '@/shared/api/apiClient'

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
    (await apiClient.getMyTravelers()).map((traveler) => ({
      id: traveler.id,
      fullName: traveler.full_name,
      relation: `${formatTravelerType(traveler.traveler_type)} on ${traveler.booking_code ?? traveler.booking_id}`,
      passportNumber: traveler.passport_number ?? 'Not provided',
      nationality: traveler.nationality ?? 'Not provided',
      birthday: traveler.date_of_birth ?? 'Not provided',
      isPrimary: traveler.is_primary === true,
    })),
}
