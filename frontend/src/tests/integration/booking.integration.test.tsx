import { screen } from '@testing-library/react'
import BookingsPage from '@/pages/account/BookingsPage'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('booking flow', () => {
  it('renders bookings page', () => {
    renderWithProviders(<BookingsPage />)
    expect(screen.getByRole('heading', { name: 'Bookings' })).toBeInTheDocument()
  })
})
