import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { AuthGuard } from '@/app/router/guards/AuthGuard'
import { env } from '@/app/config/env'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/model/auth.store'
import LoginPage from '@/pages/auth/LoginPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import { apiClient } from '@/shared/api/apiClient'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('auth flow', () => {
  it('ignores spoofed local user data without a validated session token', async () => {
    localStorage.setItem(
      'travelbook_user',
      JSON.stringify({
        id: 'admin-1',
        name: 'Spoofed Admin',
        email: 'spoofed@travelbook.com',
        role: 'admin',
      }),
    )

    renderWithProviders(
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route path="/account" element={<div>Protected account</div>} />
        </Route>
      </Routes>,
      { initialEntries: ['/account'] },
    )

    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    })

    expect(screen.queryByText('Protected account')).not.toBeInTheDocument()
  })

  it('submits the reset token that arrives from the reset link', async () => {
    const user = userEvent.setup()
    const resetPasswordSpy = vi.spyOn(authApi, 'resetPassword').mockResolvedValue(true)

    renderWithProviders(
      <Routes>
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      </Routes>,
      { initialEntries: ['/auth/reset-password?token=test-reset-token'] },
    )

    await user.type(screen.getByLabelText(/new password/i), 'new-password-123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => {
      expect(resetPasswordSpy).toHaveBeenCalledWith('test-reset-token', 'new-password-123')
    })
  })

  it('restores a live session from cookie-backed auth without persisted browser tokens', async () => {
    const previousEnableMocks = env.enableMocks
    env.enableMocks = false

    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitializing: true,
      isLoading: false,
      error: null,
    })

    const restoreSessionSpy = vi.spyOn(apiClient, 'restoreSession').mockResolvedValue({
      id: 'traveler-1',
      email: 'traveler@example.com',
      name: 'Traveler One',
      roles: ['traveler'],
      permissions: [],
      created_at: '2026-04-09T00:00:00.000Z',
      updated_at: '2026-04-09T00:00:00.000Z',
    })

    try {
      await useAuthStore.getState().initializeAuth()

      expect(restoreSessionSpy).toHaveBeenCalledTimes(1)
      expect(useAuthStore.getState().user?.email).toBe('traveler@example.com')
      expect(useAuthStore.getState().isInitializing).toBe(false)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    } finally {
      env.enableMocks = previousEnableMocks
      restoreSessionSpy.mockRestore()
      useAuthStore.setState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isInitializing: true,
        isLoading: false,
        error: null,
      })
    }
  })

  it('clears live auth state when no cookie-backed session can be restored', async () => {
    const previousEnableMocks = env.enableMocks
    env.enableMocks = false

    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitializing: true,
      isLoading: false,
      error: null,
    })

    const restoreSessionSpy = vi.spyOn(apiClient, 'restoreSession').mockResolvedValue(null)

    try {
      await useAuthStore.getState().initializeAuth()

      expect(restoreSessionSpy).toHaveBeenCalledTimes(1)
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isInitializing).toBe(false)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    } finally {
      env.enableMocks = previousEnableMocks
      restoreSessionSpy.mockRestore()
      useAuthStore.setState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isInitializing: true,
        isLoading: false,
        error: null,
      })
    }
  })
})
