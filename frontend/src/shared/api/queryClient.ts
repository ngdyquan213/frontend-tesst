import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'

function shouldRetryRequest(failureCount: number, error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (typeof status === 'number' && status < 500) {
      return false
    }
  }

  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetryRequest,
    },
  },
})
