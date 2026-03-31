import { useQuery } from '@tanstack/react-query'
import { destinationsApi } from '@/features/destinations/api/destinations.api'
import { destinationKeys } from '@/features/destinations/queries/destinationKeys'
import type { GetDestinationsOptions } from '@/features/destinations/model/destination.types'

export const useDestinationsQuery = (
  options: GetDestinationsOptions = {},
) =>
  useQuery({
    queryKey: destinationKeys.list(options),
    queryFn: () => destinationsApi.getDestinations(options),
  })
