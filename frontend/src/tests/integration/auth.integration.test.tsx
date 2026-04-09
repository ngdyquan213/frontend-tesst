import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { Route, Routes, useRoutes } from 'react-router-dom'
import { AuthGuard } from '@/app/router/guards/AuthGuard'
import { authRoutes } from '@/app/router/routes/auth.routes'
import { env } from '@/app/config/env'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/model/auth.store'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
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

  it('verifies the email token that arrives from the verification link', async () => {
    const verifyEmailSpy = vi.spyOn(authApi, 'verifyEmail').mockResolvedValue(true)

    renderWithProviders(
      <Routes>
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
      </Routes>,
      { initialEntries: ['/auth/verify-email?token=test-verify-token'] },
    )

    await waitFor(() => {
      expect(verifyEmailSpy).toHaveBeenCalledWith('test-verify-token')
    })
    expect(await screen.findByText(/your email is now verified/i)).toBeInTheDocument()
  })

  it('allows signed-in users to complete the verification link flow', async () => {
    const verifyEmailSpy = vi.spyOn(authApi, 'verifyEmail').mockResolvedValue(true)
    const getMeSpy = vi.spyOn(apiClient, 'getMe').mockResolvedValue({
      id: 'traveler-verify-1',
      email: 'traveler@example.com',
      name: 'Traveler One',
      full_name: 'Traveler One',
      email_verified: true,
      role: 'traveler',
      roles: ['traveler'],
      permissions: [],
      created_at: '2026-04-09T00:00:00.000Z',
      updated_at: '2026-04-09T00:00:00.000Z',
    })
    const initializeAuthSpy = vi.spyOn(useAuthStore.getState(), 'initializeAuth').mockResolvedValue()

    useAuthStore.setState({
      user: {
        id: 'traveler-verify-1',
        email: 'traveler@example.com',
        name: 'Traveler One',
        full_name: 'Traveler One',
        email_verified: false,
        role: 'traveler',
        roles: ['traveler'],
        permissions: [],
        created_at: '2026-04-09T00:00:00.000Z',
        updated_at: '2026-04-09T00:00:00.000Z',
      },
      token: 'session-token',
      refreshToken: null,
      isAuthenticated: true,
      isInitializing: false,
      isLoading: false,
      error: null,
    })

    const AuthRoutesHarness = () => useRoutes(authRoutes)

    try {
      renderWithProviders(<AuthRoutesHarness />, {
        initialEntries: ['/auth/verify-email?token=signed-in-verify-token'],
      })

      await waitFor(() => {
        expect(verifyEmailSpy).toHaveBeenCalledWith('signed-in-verify-token')
      })
      expect(await screen.findByText(/your email is now verified/i)).toBeInTheDocument()
      expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument()
    } finally {
      getMeSpy.mockRestore()
      initializeAuthSpy.mockRestore()
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

  it('blocks login submission when credentials do not meet live validation rules', async () => {
    const user = userEvent.setup()
    const loginSpy = vi.spyOn(apiClient, 'login').mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 'traveler-1',
        email: 'traveler@example.com',
        full_name: 'Traveler One',
        role: 'traveler',
        is_active: true,
        is_verified: true,
      },
    } as never)

    renderWithProviders(
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
      </Routes>,
      { initialEntries: ['/auth/login'] },
    )

    await user.type(screen.getByLabelText(/email/i), 'traveler@example.com')
    await user.type(screen.getByLabelText(/password/i), 'short')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    expect(loginSpy).not.toHaveBeenCalled()
  })

  it('blocks registration submission when the password is shorter than the backend policy', async () => {
    const user = userEvent.setup()
    const registerSpy = vi.spyOn(apiClient, 'register').mockResolvedValue({
      id: 'traveler-1',
      email: 'traveler@example.com',
      name: 'Traveler One',
      roles: ['traveler'],
      permissions: [],
      created_at: '2026-04-09T00:00:00.000Z',
      updated_at: '2026-04-09T00:00:00.000Z',
    })

    renderWithProviders(
      <Routes>
        <Route path="/auth/register" element={<RegisterPage />} />
      </Routes>,
      { initialEntries: ['/auth/register'] },
    )

    await user.type(screen.getByLabelText(/full name/i), 'Traveler One')
    await user.type(screen.getByLabelText(/^email$/i), 'traveler@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/password must be at least 10 characters/i)).toBeInTheDocument()
    expect(registerSpy).not.toHaveBeenCalled()
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
