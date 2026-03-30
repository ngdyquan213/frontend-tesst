import { resolveAfter } from '@/shared/api/apiClient'
import { tours } from '@/shared/api/mockData'

export const adminToursApi = {
  getTours: () => resolveAfter(tours),
  createTour: async () => resolveAfter(tours[0]),
  updateTour: async () => resolveAfter(tours[0]),
}

