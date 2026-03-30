import { resolveAfter } from '@/shared/api/apiClient'
import { destinations, tours, tourSchedules } from '@/shared/api/mockData'

export const toursApi = {
  getTours: async (search = '') =>
    resolveAfter(
      tours.filter((tour) =>
        `${tour.title} ${tour.location} ${tour.summary}`.toLowerCase().includes(search.toLowerCase()),
      ),
    ),
  getTourDetail: async (slug: string) => resolveAfter(tours.find((tour) => tour.slug === slug) ?? tours[0]),
  getTourSchedules: async (tourId: string) =>
    resolveAfter(tourSchedules.filter((schedule) => schedule.tourId === tourId)),
  getDestinations: async () => resolveAfter(destinations),
}

