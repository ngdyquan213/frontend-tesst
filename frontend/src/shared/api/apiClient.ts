import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { env } from '@/app/config/env'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { createAdminApi } from '@/shared/api/adminApi'
import { createAuthUserApi } from '@/shared/api/authUserApi'
import { isMockApiEnabled } from '@/shared/api/mockMode'
import { getStoredMockAuthState } from '@/shared/api/mockSession'
import { createPaymentRefundsApi } from '@/shared/api/paymentRefundsApi'
import { createPublicContentApi } from '@/shared/api/publicContentApi'
import { createSupportDocumentsApi } from '@/shared/api/supportDocumentsApi'
import { createTravelBookingsApi } from '@/shared/api/travelBookingsApi'

const API_BASE_URL = env.apiBaseUrl
const SKIP_AUTH_REDIRECT_HEADER = 'X-Skip-Auth-Redirect'

function createHttpClient() {
  const client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return client
}

const httpClient = createHttpClient()
const authUserApi = createAuthUserApi(httpClient, {
  skipAuthRedirectHeader: SKIP_AUTH_REDIRECT_HEADER,
})

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!isMockApiEnabled()) {
    return config
  }

  const token = useAuthStore.getState().token ?? getStoredMockAuthState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const isAuthRoute = originalRequest?.url?.startsWith('/auth/')
    const skipAuthRedirect = originalRequest?.headers?.[SKIP_AUTH_REDIRECT_HEADER] === 'true'

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
        await authUserApi.refreshToken()
        const token = useAuthStore.getState().token
        if (isMockApiEnabled() && token) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return httpClient(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export const apiClient = {
  ...authUserApi,
  ...createTravelBookingsApi(httpClient),
  ...createPaymentRefundsApi(httpClient),
  ...createPublicContentApi(httpClient),
  ...createSupportDocumentsApi(httpClient),
  ...createAdminApi(httpClient),
}
