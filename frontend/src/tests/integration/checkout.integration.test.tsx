import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth.store'
import CheckoutPage from '@/pages/checkout/CheckoutPage'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('checkout flow', () => {
  it('shows the mock lead traveler on legacy slug-based checkout routes', async () => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'alex@travelbook.com',
        name: 'Alexander Sterling',
        role: 'traveler',
        roles: ['traveler'],
        permissions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      token: 'mock-access-token:user-1',
      refreshToken: 'mock-refresh-token:user-1',
      isAuthenticated: true,
      isInitializing: false,
      isLoading: false,
      error: null,
    })

    renderWithProviders(
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>,
      { initialEntries: ['/checkout?tourId=amalfi-coast-sailing&scheduleId=schedule-1'] },
    )

    expect(await screen.findByRole('heading', { name: 'Review your trip' })).toBeInTheDocument()
    expect(screen.getByText('Lead traveler: Alexander Sterling')).toBeInTheDocument()
  })
})
