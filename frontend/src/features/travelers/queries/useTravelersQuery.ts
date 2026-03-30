import { useQuery } from '@tanstack/react-query'
import { travelersApi } from '@/features/travelers/api/travelers.api'
import { travelerKeys } from '@/features/travelers/queries/travelerKeys'

export const useTravelersQuery = () =>
  useQuery({
    queryKey: travelerKeys.list(),
    queryFn: travelersApi.getTravelers,
  })

