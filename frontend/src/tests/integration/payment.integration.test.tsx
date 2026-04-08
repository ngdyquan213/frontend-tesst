import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { paymentsApi } from '@/features/payments/api/payments.api'
import PaymentPage from '@/pages/checkout/PaymentPage'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('payment flow', () => {
  it('loads available payment methods and enables checkout submission', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/checkout/payment" element={<PaymentPage />} />
      </Routes>,
      { initialEntries: ['/checkout/payment?tourId=amalfi-coast-sailing&scheduleId=schedule-1'] },
    )

    expect(await screen.findByRole('heading', { name: 'Payment' })).toBeInTheDocument()

    await user.click(await screen.findByText('Bank Transfer'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pay now' })).toBeEnabled()
    })
  })

  it('stays on the payment page when the provider is still processing the payment', async () => {
    const user = userEvent.setup()

    vi.spyOn(paymentsApi, 'createPaymentIntent').mockResolvedValue({
      id: 'payment-processing',
      bookingId: 'booking-processing',
      methodId: 'bank_transfer',
      amount: 2598,
      status: 'processing',
    })

    renderWithProviders(
      <Routes>
        <Route path="/checkout/payment" element={<PaymentPage />} />
        <Route path="/checkout/payment/success" element={<div>Success route</div>} />
        <Route path="/checkout/payment/failed" element={<div>Failed route</div>} />
      </Routes>,
      { initialEntries: ['/checkout/payment?tourId=amalfi-coast-sailing&scheduleId=schedule-1'] },
    )

    await user.click(await screen.findByText('Bank Transfer'))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pay now' })).toBeEnabled()
    })
    await user.click(screen.getByRole('button', { name: 'Pay now' }))

    expect(await screen.findByText(/still pending confirmation/i)).toBeInTheDocument()
    expect(screen.queryByText('Success route')).not.toBeInTheDocument()
    expect(screen.queryByText('Failed route')).not.toBeInTheDocument()
  })
})
