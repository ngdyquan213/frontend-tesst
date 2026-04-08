import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import CheckoutPage from '@/pages/checkout/CheckoutPage'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('checkout flow', () => {
  it('shows the mock lead traveler on legacy slug-based checkout routes', async () => {
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
