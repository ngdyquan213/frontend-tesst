import type { AxiosInstance } from 'axios'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { env } from '@/app/config/env'
import { paymentsApi } from '@/features/payments/api/payments.api'
import HelpPage from '@/pages/public/HelpPage'
import { createTourDetailQueryOptions } from '@/features/tours/queries/useTourDetailQuery'
import { apiClient } from '@/shared/api/apiClient'
import {
  getLivePaymentMethods,
  mapApiPaymentToPaymentRecord,
  mapApiRefundToRefundRecord,
} from '@/shared/lib/appMappers'
import { createAuthUserApi } from '@/shared/api/authUserApi'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('review fixes', () => {
  it('keeps Stripe hidden from the fallback payment catalog unless it is explicitly enabled', () => {
    expect(getLivePaymentMethods().map((method) => method.id)).toEqual([
      'vnpay',
      'momo',
      'manual',
    ])

    expect(getLivePaymentMethods({ includeStripe: true }).map((method) => method.id)).toEqual([
      'stripe',
      'vnpay',
      'momo',
      'manual',
    ])
  })

  it('maps live backend payment statuses into terminal ui states', () => {
    const methods = getLivePaymentMethods()

    expect(
      mapApiPaymentToPaymentRecord(
        {
          id: 'payment-paid',
          booking_id: 'booking-1',
          amount: 100,
          currency: 'USD',
          payment_method: 'manual',
          payment_status: 'PAID',
          created_at: '2026-04-08T00:00:00.000Z',
          updated_at: '2026-04-08T00:00:00.000Z',
        },
        methods,
      ).status,
    ).toBe('success')

    expect(
      mapApiPaymentToPaymentRecord(
        {
          id: 'payment-authorized',
          booking_id: 'booking-2',
          amount: 100,
          currency: 'USD',
          payment_method: 'manual',
          payment_status: 'AUTHORIZED',
          created_at: '2026-04-08T00:00:00.000Z',
          updated_at: '2026-04-08T00:00:00.000Z',
        },
        methods,
      ).status,
    ).toBe('processing')

    expect(
      mapApiPaymentToPaymentRecord(
        {
          id: 'payment-cancelled',
          booking_id: 'booking-3',
          amount: 100,
          currency: 'USD',
          payment_method: 'manual',
          payment_status: 'CANCELLED',
          created_at: '2026-04-08T00:00:00.000Z',
          updated_at: '2026-04-08T00:00:00.000Z',
        },
        methods,
      ).status,
    ).toBe('failed')
  })

  it('maps failed and cancelled refunds without falling back to draft', () => {
    expect(
      mapApiRefundToRefundRecord({
        id: 'refund-failed',
        booking_id: 'booking-1',
        amount: 100,
        currency: 'USD',
        status: 'failed',
        created_at: '2026-04-08T00:00:00.000Z',
      }).status,
    ).toBe('failed')

    expect(
      mapApiRefundToRefundRecord({
        id: 'refund-cancelled',
        booking_id: 'booking-2',
        amount: 100,
        currency: 'USD',
        status: 'cancelled',
        created_at: '2026-04-08T00:00:00.000Z',
      }).status,
    ).toBe('cancelled')
  })

  it('keeps the same idempotency key until checkout reaches a terminal payment state', async () => {
    const previousEnableMocks = env.enableMocks
    env.enableMocks = false
    localStorage.setItem('access_token', 'retry-token-123')

    const createTourCheckoutSpy = vi
      .spyOn(apiClient, 'createTourCheckout')
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({
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
      .mockResolvedValueOnce({
        booking: {
          id: 'booking-123',
          user_id: 'user-1',
          booking_code: 'TC-123',
          booking_type: 'TOUR',
          booking_status: 'CONFIRMED',
          total_price: 2598,
          total_final_amount: 2598,
          booking_date: '2026-04-08T00:00:00.000Z',
          travel_date: '2026-06-14',
          number_of_travelers: 1,
          payment_status: 'PAID',
          created_at: '2026-04-08T00:00:00.000Z',
          updated_at: '2026-04-08T00:00:00.000Z',
        },
        payment: {
          id: 'payment-123',
          booking_id: 'booking-123',
          amount: 2598,
          currency: 'USD',
          payment_status: 'PAID',
          created_at: '2026-04-08T00:00:00.000Z',
          updated_at: '2026-04-08T00:00:00.000Z',
          payment_method: 'manual',
        },
      })
      .mockResolvedValueOnce({
        booking: {
          id: 'booking-456',
          user_id: 'user-1',
          booking_code: 'TC-456',
          booking_type: 'TOUR',
          booking_status: 'CONFIRMED',
          total_price: 2598,
          total_final_amount: 2598,
          booking_date: '2026-04-08T00:00:00.000Z',
          travel_date: '2026-06-14',
          number_of_travelers: 1,
          payment_status: 'PAID',
          created_at: '2026-04-08T00:00:00.000Z',
          updated_at: '2026-04-08T00:00:00.000Z',
        },
        payment: {
          id: 'payment-456',
          booking_id: 'booking-456',
          amount: 2598,
          currency: 'USD',
          payment_status: 'PAID',
          created_at: '2026-04-08T00:00:00.000Z',
          updated_at: '2026-04-08T00:00:00.000Z',
          payment_method: 'manual',
        },
      })

    try {
      await expect(
        paymentsApi.createPaymentIntent({
          methodId: 'manual',
          tourId: 'tour-1',
          scheduleId: 'schedule-1',
          travelerCounts: {
            adultCount: 1,
            childCount: 0,
            infantCount: 0,
          },
          travelDate: '2026-06-14',
        }),
      ).rejects.toThrow('timeout')

      await paymentsApi.createPaymentIntent({
        methodId: 'manual',
        tourId: 'tour-1',
        scheduleId: 'schedule-1',
        travelerCounts: {
          adultCount: 1,
          childCount: 0,
          infantCount: 0,
        },
        travelDate: '2026-06-14',
      })

      await paymentsApi.createPaymentIntent({
        methodId: 'manual',
        tourId: 'tour-1',
        scheduleId: 'schedule-1',
        travelerCounts: {
          adultCount: 1,
          childCount: 0,
          infantCount: 0,
        },
        travelDate: '2026-06-14',
      })

      await paymentsApi.createPaymentIntent({
        methodId: 'manual',
        tourId: 'tour-1',
        scheduleId: 'schedule-1',
        travelerCounts: {
          adultCount: 1,
          childCount: 0,
          infantCount: 0,
        },
        travelDate: '2026-06-14',
      })

      expect(createTourCheckoutSpy).toHaveBeenCalledTimes(4)
      expect(createTourCheckoutSpy.mock.calls[0]?.[0]).toMatchObject({
        adult_count: 1,
        child_count: 0,
        infant_count: 0,
      })
      expect(createTourCheckoutSpy.mock.calls[0]?.[0].idempotency_key).toBe(
        createTourCheckoutSpy.mock.calls[1]?.[0].idempotency_key,
      )
      expect(createTourCheckoutSpy.mock.calls[1]?.[0].idempotency_key).toBe(
        createTourCheckoutSpy.mock.calls[2]?.[0].idempotency_key,
      )
      expect(createTourCheckoutSpy.mock.calls[2]?.[0].idempotency_key).not.toBe(
        createTourCheckoutSpy.mock.calls[3]?.[0].idempotency_key,
      )
    } finally {
      env.enableMocks = previousEnableMocks
    }
  })

  it('submits live registration without deriving a frontend username from the email local-part', async () => {
    const previousEnableMocks = env.enableMocks
    env.enableMocks = false

    const client = {
      post: vi.fn().mockResolvedValue({
        data: {
          id: 'traveler-1',
          email: 'alex@example.com',
          full_name: 'Alex Example',
          username: 'alex_1234abcd',
          roles: ['traveler'],
          permissions: [],
          created_at: '2026-04-09T00:00:00.000Z',
          updated_at: '2026-04-09T00:00:00.000Z',
        },
      }),
    } as unknown as AxiosInstance

    try {
      const authUserApi = createAuthUserApi(client, {
        skipAuthRedirectHeader: 'X-Skip-Auth-Redirect',
      })

      await authUserApi.register('alex@example.com', 'Password123', 'Alex Example')

      expect(client.post).toHaveBeenCalledWith('/auth/register', {
        email: 'alex@example.com',
        password: 'Password123',
        full_name: 'Alex Example',
      })
    } finally {
      env.enableMocks = previousEnableMocks
    }
  })

  it('uses the live api for non-uuid tour ids when mocks are disabled', async () => {
    const previousEnableMocks = env.enableMocks
    env.enableMocks = false

    const getTourByIdSpy = vi
      .spyOn(apiClient, 'getTourById')
      .mockRejectedValue(new Error('legacy slugs are not accepted by the live api'))

    try {
      const queryOptions = createTourDetailQueryOptions('amalfi-coast-sailing')

      await expect(queryOptions.queryFn({ signal: undefined })).rejects.toThrow(
        'legacy slugs are not accepted by the live api',
      )
      expect(getTourByIdSpy).toHaveBeenCalledWith('amalfi-coast-sailing')
    } finally {
      env.enableMocks = previousEnableMocks
    }
  })

  it('shows a sign-in gate on the public help page instead of the authenticated support form', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/help" element={<HelpPage />} />
      </Routes>,
      { initialEntries: ['/help'] },
    )

    expect(await screen.findByText(/sign in to open a support request/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /send request/i })).not.toBeInTheDocument()
  })
})
