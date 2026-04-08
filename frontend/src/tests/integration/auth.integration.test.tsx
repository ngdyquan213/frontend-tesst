import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { AuthGuard } from '@/app/router/guards/AuthGuard'
import { authApi } from '@/features/auth/api/auth.api'
import LoginPage from '@/pages/auth/LoginPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
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
})
