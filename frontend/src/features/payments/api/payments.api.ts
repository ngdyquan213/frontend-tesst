import { env } from '@/app/config/env'
import { getDefaultPaymentMethods, mapApiPaymentToPaymentRecord } from '@/shared/lib/appMappers'
import { resolveAfter } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { paymentMethods, payments } from '@/shared/api/mockData'
import type { PaymentMethod } from '@/shared/types/common'

interface CreatePaymentIntentInput {
  methodId: string
  tourId: string
  scheduleId: string
  travelerCount: number
  travelDate: string
}

function buildIdempotencyKey(tourId: string, scheduleId: string, travelerCount: number) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `payment-${tourId}-${scheduleId}-${travelerCount}-${Date.now()}`
}

export const paymentsApi = {
  getAvailablePaymentMethods: async (): Promise<PaymentMethod[]> => {
    if (env.enableMocks) {
      return resolveAfter(paymentMethods)
    }

    return apiClient.getAvailablePaymentMethods()
  },
  createPaymentIntent: async ({
    methodId,
    tourId,
    scheduleId,
    travelerCount,
    travelDate,
  }: CreatePaymentIntentInput) => {
    if (env.enableMocks) {
      const payment = payments[0]
      payment.methodId = methodId
      return resolveAfter(payment)
    }

    const bookingResponse = await apiClient.createBooking({
      booking_type: 'TOUR',
      tour_id: tourId,
      schedule_id: scheduleId,
      number_of_travelers: travelerCount,
      travel_date: travelDate,
    })
    const paymentIntent = await apiClient.initiatePayment({
      booking_id: bookingResponse.booking.id,
      payment_method: methodId,
      idempotency_key: buildIdempotencyKey(tourId, scheduleId, travelerCount),
    })

    const payment = await apiClient
      .getPayment(paymentIntent.payment_id)
      .catch(() => ({
        id: paymentIntent.payment_id,
        booking_id: paymentIntent.booking_id,
        amount: paymentIntent.amount,
        currency: 'USD',
        payment_status: paymentIntent.payment_status,
        created_at: paymentIntent.created_at,
        updated_at: paymentIntent.created_at,
        payment_method: methodId,
      }))

    return mapApiPaymentToPaymentRecord(payment, getDefaultPaymentMethods())
  },
  getPaymentStatus: async (paymentId?: string) => {
    if (env.enableMocks) {
      return resolveAfter(payments[0])
    }

    if (!paymentId) {
      throw new Error('A payment id is required to fetch payment status.')
    }

    const payment = await apiClient.getPayment(paymentId)
    return mapApiPaymentToPaymentRecord(payment, getDefaultPaymentMethods())
  },
}
