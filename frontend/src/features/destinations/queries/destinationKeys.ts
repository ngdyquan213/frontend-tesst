// import { createQueryKeys } from '@/shared/api/createQueryKeys'

// export const destinationKeys = createQueryKeys('destinations')

import { normalizeDestinationQueryParams } from '@/features/destinations/model/destination.schema'
import type { DestinationQueryParams } from '@/features/destinations/model/destination.types'

export const destinationKeys = {
  all: ['destinations'] as const,
  lists: () => [...destinationKeys.all, 'list'] as const,
  list: (params: DestinationQueryParams = {}) =>
    [...destinationKeys.lists(), normalizeDestinationQueryParams(params)] as const,
}
