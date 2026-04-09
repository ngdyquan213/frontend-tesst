import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { env } from '@/app/config/env'
import { paymentsApi } from '@/features/payments/api/payments.api'
import { useAuthStore } from '@/features/auth/model/auth.store'
import PaymentPage from '@/pages/checkout/PaymentPage'
import { apiClient } from '@/shared/api/apiClient'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('payment flow', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'mock-access-token:user-1')
    localStorage.setItem('refresh_token', 'mock-refresh-token:user-1')
    localStorage.setItem('token_type', 'Bearer')
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
  })

  it('shows configured payment methods on the payment step', async () => {
    vi.spyOn(paymentsApi, 'getAvailablePaymentMethods').mockResolvedValue([
      {
        id: 'manual',
        type: 'bank',
        title: 'Manual Settlement',
        description: 'Create the booking now and settle payment offline',
        icon: 'account_balance',
      },
      {
        id: 'vnpay',
        type: 'wallet',
        title: 'VNPay',
        description: 'Pay online with VNPay',
        icon: 'account_balance_wallet',
      },
    ])

    renderWithProviders(
      <Routes>
        <Route path="/checkout/payment" element={<PaymentPage />} />
      </Routes>,
      { initialEntries: ['/checkout/payment?tourId=amalfi-coast-sailing&scheduleId=schedule-1'] },
    )

    expect(await screen.findByRole('heading', { name: 'Payment' })).toBeInTheDocument()
    expect(await screen.findByText('Manual Settlement')).toBeInTheDocument()
    expect(await screen.findByText('VNPay')).toBeInTheDocument()
  })

  it('keeps self-service methods visible when the backend exposes them', async () => {
    vi.spyOn(paymentsApi, 'getAvailablePaymentMethods').mockResolvedValue([
      {
        id: 'manual',
        type: 'bank',
        title: 'Manual confirmation',
        description: 'Create the booking now and settle payment offline',
        icon: 'handshake',
      },
      {
        id: 'vnpay',
        type: 'wallet',
        title: 'VNPay',
        description: 'Pay online with VNPay',
        icon: 'account_balance_wallet',
      },
    ])

    renderWithProviders(
      <Routes>
        <Route path="/checkout/payment" element={<PaymentPage />} />
      </Routes>,
      { initialEntries: ['/checkout/payment?tourId=amalfi-coast-sailing&scheduleId=schedule-1'] },
    )

    expect(await screen.findByText('Manual confirmation')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /vnpay/i })).toBeInTheDocument()
  })

  it('uses explicit manual-settlement copy when no self-service method is available', async () => {
    vi.spyOn(paymentsApi, 'getAvailablePaymentMethods').mockResolvedValue([
      {
        id: 'manual',
        type: 'bank',
        title: 'Manual confirmation',
        description: 'Create the booking now and settle payment offline',
        icon: 'handshake',
      },
    ])

    renderWithProviders(
      <Routes>
        <Route path="/checkout/payment" element={<PaymentPage />} />
      </Routes>,
      { initialEntries: ['/checkout/payment?tourId=amalfi-coast-sailing&scheduleId=schedule-1'] },
    )

    expect(await screen.findByRole('radio', { name: /manual confirmation/i })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Create booking request' })).toBeInTheDocument()
  })

  it('uses the live checkout endpoint when mocks are disabled', async () => {
    const previousEnableMocks = env.enableMocks
    env.enableMocks = false

    const createTourCheckoutSpy = vi.spyOn(apiClient, 'createTourCheckout').mockResolvedValue({
      booking: {
        id: 'booking-123',
        user_id: 'user-1',
        booking_code: 'TC-123',
        booking_type: 'TOUR',
        booking_status: 'PENDING',
        total_price: 2598,
        total_final_amount: 2598,
        booking_date: '2026-04-08T00:00:00.000Z',
        travel_date: '2026-06-14',
        number_of_travelers: 1,
        payment_status: 'PENDING',
        created_at: '2026-04-08T00:00:00.000Z',
        updated_at: '2026-04-08T00:00:00.000Z',
      },
      payment: {
        id: 'payment-123',
        booking_id: 'booking-123',
        amount: 2598,
        currency: 'USD',
        payment_status: 'PENDING',
        created_at: '2026-04-08T00:00:00.000Z',
        updated_at: '2026-04-08T00:00:00.000Z',
        payment_method: 'manual',
      },
    })

    try {
      const payment = await paymentsApi.createPaymentIntent({
        methodId: 'vnpay',
        tourId: 'amalfi-coast-sailing',
        scheduleId: 'schedule-1',
        travelerCounts: {
          adultCount: 1,
          childCount: 0,
          infantCount: 0,
        },
        travelDate: '2026-06-14',
      })

      expect(createTourCheckoutSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          schedule_id: 'schedule-1',
          adult_count: 1,
          child_count: 0,
          infant_count: 0,
          payment_method: 'vnpay',
        }),
      )
      expect(payment.bookingId).toBe('booking-123')
      expect(payment.id).toBe('payment-123')
    } finally {
      env.enableMocks = previousEnableMocks
    }
  })

  it('rejects empty payment method ids before creating a checkout request', async () => {
    await expect(
      paymentsApi.createPaymentIntent({
        methodId: ' ',
        tourId: 'amalfi-coast-sailing',
        scheduleId: 'schedule-1',
        travelerCounts: {
          adultCount: 1,
          childCount: 0,
          infantCount: 0,
        },
        travelDate: '2026-06-14',
      }),
    ).rejects.toThrow('A valid payment method is required before checkout can continue.')
  })
})
