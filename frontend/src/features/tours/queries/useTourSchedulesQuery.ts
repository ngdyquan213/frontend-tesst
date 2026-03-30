import { useQuery } from '@tanstack/react-query'
import { toursApi } from '@/features/tours/api/tours.api'
import { tourKeys } from '@/features/tours/queries/tourKeys'

export const useTourSchedulesQuery = (tourId: string) =>
  useQuery({
    queryKey: [...tourKeys.detail(tourId), 'schedules'],
    queryFn: () => toursApi.getTourSchedules(tourId),
    enabled: Boolean(tourId),
  })

