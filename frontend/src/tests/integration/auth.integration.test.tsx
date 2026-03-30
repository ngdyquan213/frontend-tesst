import { screen } from '@testing-library/react'
import LoginPage from '@/pages/auth/LoginPage'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('auth flow', () => {
  it('renders the login form', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })
})

