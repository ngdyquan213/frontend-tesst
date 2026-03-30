import { screen } from '@testing-library/react'
import PaymentPage from '@/pages/checkout/PaymentPage'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('payment flow', () => {
  it('renders payment selection', () => {
    renderWithProviders(<PaymentPage />)
    expect(screen.getByRole('heading', { name: 'Payment' })).toBeInTheDocument()
  })
})
