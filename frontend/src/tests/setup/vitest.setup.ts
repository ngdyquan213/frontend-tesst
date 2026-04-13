import '@testing-library/jest-dom/vitest'
import { useAuthStore, createUnauthenticatedAuthState } from '@/features/auth/model/auth.store'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState(createUnauthenticatedAuthState())
})
