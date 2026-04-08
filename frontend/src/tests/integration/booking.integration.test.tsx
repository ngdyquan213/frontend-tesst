import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import BookingDetailPage from '@/pages/account/BookingDetailPage'
import BookingsPage from '@/pages/account/BookingsPage'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('booking flow', () => {
  it('renders bookings page', () => {
    renderWithProviders(<BookingsPage />)
    expect(screen.getByRole('heading', { name: 'Bookings' })).toBeInTheDocument()
  })

  it('shows an unavailable state for an unknown booking id', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/account/bookings/:bookingId" element={<BookingDetailPage />} />
      </Routes>,
      { initialEntries: ['/account/bookings/booking-missing'] },
    )

    expect(await screen.findByText(/booking unavailable/i)).toBeInTheDocument()
  })
})
