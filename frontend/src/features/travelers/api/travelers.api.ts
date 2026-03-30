import { resolveAfter } from '@/shared/api/apiClient'
import { travelers } from '@/shared/api/mockData'

export const travelersApi = {
  getTravelers: () => resolveAfter(travelers),
  createTraveler: async (payload: { fullName: string }) => {
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
    const traveler = travelers.find((item) => item.id === payload.id)
    if (traveler) traveler.fullName = payload.fullName
    return resolveAfter(traveler)
  },
  deleteTraveler: async (id: string) => resolveAfter(travelers.filter((traveler) => traveler.id !== id)),
}

