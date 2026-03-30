export const normalizeApiError = (error: unknown) =>
  error instanceof Error ? error.message : 'Unexpected error'

