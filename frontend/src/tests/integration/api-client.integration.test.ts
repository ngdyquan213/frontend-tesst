import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { attachSessionRefreshInterceptor, createHttpClient } from '@/shared/api/apiClient'

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

function deferredPromise() {
  let resolve!: () => void
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve }
}

function createUnauthorizedError(config: InternalAxiosRequestConfig) {
  const response: AxiosResponse = {
    config,
    data: { message: 'Unauthorized' },
    headers: {},
    status: 401,
    statusText: 'Unauthorized',
  }

  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('api client session refresh interceptor', () => {
  it('deduplicates concurrent refresh attempts after multiple 401 responses', async () => {
    const refreshDeferred = deferredPromise()
    let refreshCalls = 0
    let protectedCalls = 0

    const adapter: AxiosAdapter = async (config) => {
      const retryableConfig = config as RetryableConfig

      if (config.url === '/protected') {
        protectedCalls += 1

        if (!retryableConfig._retry) {
          throw createUnauthorizedError(config)
        }

        return {
          config,
          data: { ok: true, attempt: protectedCalls },
          headers: {},
          status: 200,
          statusText: 'OK',
        }
      }

      if (config.url === '/auth/refresh') {
        refreshCalls += 1
        await refreshDeferred.promise

        return {
          config,
          data: { token_type: 'bearer' },
          headers: {},
          status: 200,
          statusText: 'OK',
        }
      }

      throw new Error(`Unexpected request: ${config.url}`)
    }

    const client = createHttpClient({
      adapter,
      baseURL: '/api/v1',
    })

    const onAuthFailure = vi.fn()
    attachSessionRefreshInterceptor(
      client,
      {
        refreshToken: async () => {
          await client.post('/auth/refresh', {})
        },
      },
      {
        skipAuthRedirectHeader: 'X-Skip-Auth-Redirect',
        onAuthFailure,
      },
    )

    const firstRequest = client.get('/protected')
    const secondRequest = client.get('/protected')

    await vi.waitFor(() => {
      expect(refreshCalls).toBe(1)
    })

    refreshDeferred.resolve()

    const [firstResponse, secondResponse] = await Promise.all([firstRequest, secondRequest])

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    expect(refreshCalls).toBe(1)
    expect(protectedCalls).toBe(4)
    expect(onAuthFailure).not.toHaveBeenCalled()
  })
})
