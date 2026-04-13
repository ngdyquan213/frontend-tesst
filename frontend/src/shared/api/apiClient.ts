import axios from 'axios'
import type { AxiosAdapter, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { env } from '@/app/config/env'
import { createAdminApi } from '@/shared/api/adminApi'
import { createAuthUserApi } from '@/shared/api/authUserApi'
import { createMockApiClient } from '@/shared/api/mockAppApi'
import { createPaymentRefundsApi } from '@/shared/api/paymentRefundsApi'
import { createPublicContentApi } from '@/shared/api/publicContentApi'
import { createSupportDocumentsApi } from '@/shared/api/supportDocumentsApi'
import { createTravelBookingsApi } from '@/shared/api/travelBookingsApi'

const API_BASE_URL = env.apiBaseUrl
const SKIP_AUTH_REDIRECT_HEADER = 'X-Skip-Auth-Redirect'

interface HttpClientOptions {
  adapter?: AxiosAdapter
  baseURL?: string
}

interface SessionRefreshInterceptorOptions {
  onAuthFailure?: (error: unknown) => void
  skipAuthRedirectHeader: string
}

interface SessionRefreshApi {
  refreshToken: () => Promise<unknown>
}

export function createHttpClient(options?: HttpClientOptions) {
  const client = axios.create({
    baseURL: options?.baseURL ?? API_BASE_URL,
    adapter: options?.adapter,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return client
}

export function attachSessionRefreshInterceptor(
  client: AxiosInstance,
  authApi: SessionRefreshApi,
  options: SessionRefreshInterceptorOptions,
) {
  const { onAuthFailure, skipAuthRedirectHeader } = options
  let refreshPromise: Promise<void> | null = null

  const ensureSessionRefreshed = async () => {
    if (!refreshPromise) {
      refreshPromise = authApi
        .refreshToken()
        .then(() => undefined)
        .finally(() => {
          refreshPromise = null
        })
    }

    return refreshPromise
  }

  return client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as
        | (InternalAxiosRequestConfig & { _retry?: boolean })
        | undefined
      const isAuthRoute = originalRequest?.url?.startsWith('/auth/')
      const skipAuthRedirect = originalRequest?.headers?.[skipAuthRedirectHeader] === 'true'

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/refresh') &&
        !isAuthRoute &&
        !skipAuthRedirect
      ) {
        originalRequest._retry = true
        try {
          await ensureSessionRefreshed()
          return client(originalRequest)
        } catch (refreshError) {
          onAuthFailure?.(refreshError)
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    },
  )
}

const httpClient = createHttpClient()
const authUserApi = createAuthUserApi(httpClient, {
  skipAuthRedirectHeader: SKIP_AUTH_REDIRECT_HEADER,
})

attachSessionRefreshInterceptor(httpClient, authUserApi, {
  skipAuthRedirectHeader: SKIP_AUTH_REDIRECT_HEADER,
  onAuthFailure: () => {
    window.location.href = '/auth/login'
  },
})

const liveApiClient = {
  ...authUserApi,
  ...createTravelBookingsApi(httpClient),
  ...createPaymentRefundsApi(httpClient),
  ...createPublicContentApi(httpClient),
  ...createSupportDocumentsApi(httpClient),
  ...createAdminApi(httpClient),
}

export const apiClient = env.enableMocks
  ? {
      ...liveApiClient,
      ...createMockApiClient(),
    }
  : liveApiClient
