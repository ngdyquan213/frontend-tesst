import { isMockApiEnabled } from '@/shared/api/mockMode'
import { resolveAfter } from '@/shared/api/resolveAfter'
import { loadMockData } from '@/shared/api/loadMockData'

export type MockDataModule = Awaited<ReturnType<typeof loadMockData>>

export async function resolveMockData<T>(
  selector: (mockData: MockDataModule) => T | Promise<T>,
): Promise<T> {
  const mockData = await loadMockData()
  return resolveAfter(await selector(mockData))
}

export async function resolveMockable<T>(options: {
  mock: (mockData: MockDataModule) => T | Promise<T>
  live: () => Promise<T>
}): Promise<T> {
  if (isMockApiEnabled()) {
    return resolveMockData(options.mock)
  }

  return options.live()
}
