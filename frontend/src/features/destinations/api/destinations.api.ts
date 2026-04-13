import { normalizeDestinationQueryParams } from '@/features/destinations/model/destination.schema'
import { apiClient } from '@/shared/api/apiClient'
import type { Destination, DestinationQueryParams } from '@/features/destinations/model/destination.types'

export async function getDestinations(
  params: DestinationQueryParams = {},
  _signal?: AbortSignal,
): Promise<Destination[]> {
  void _signal
  const normalizedParams = normalizeDestinationQueryParams(params)
  return apiClient.getDestinations(normalizedParams)
}

export const destinationsApi = {
  getDestinations,
}
