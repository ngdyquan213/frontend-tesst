import {
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
  resolvePaymentMethodCatalog,
  type CreatePaymentIntentInput,
} from '@/features/payments/lib/paymentCheckout'
import { isSupportedCheckoutPaymentMethod } from '@/features/payments/lib/paymentMethodAvailability'
import { mapApiPaymentToPaymentRecord } from '@/shared/lib/appMappers'
import { apiClient } from '@/shared/api/apiClient'
import type { PaymentMethod, PaymentStatus } from '@/shared/types/common'

function isTerminalPaymentStatus(status: PaymentStatus) {
  return status === 'success' || status === 'failed'
}

export const paymentsApi = {
  getAvailablePaymentMethods: async (): Promise<PaymentMethod[]> => apiClient.getAvailablePaymentMethods(),
  createPaymentIntent: async ({
    methodId,
    tourId,
    scheduleId,
    travelerCounts,
    travelDate,
  }: CreatePaymentIntentInput) => {
    if (!isSupportedCheckoutPaymentMethod(methodId)) {
      throw new Error('A valid payment method is required before checkout can continue.')
    }

    const input = {
      methodId,
      tourId,
      scheduleId,
      travelerCounts,
      travelDate,
    }

    const { storageKey, idempotencyKey } = getOrCreateIdempotencyKey(input)
    const checkoutResponse = await apiClient.createTourCheckout({
      schedule_id: scheduleId,
      adult_count: travelerCounts.adultCount,
      child_count: travelerCounts.childCount,
      infant_count: travelerCounts.infantCount,
      payment_method: methodId,
      idempotency_key: idempotencyKey,
    })
    const payment = checkoutResponse.payment
    const paymentMethods = await resolvePaymentMethodCatalog(payment.payment_method ?? methodId)
    const paymentRecord = mapApiPaymentToPaymentRecord(
      {
        ...payment,
        booking_id: checkoutResponse.booking.id,
      },
      paymentMethods,
    )

    if (isTerminalPaymentStatus(paymentRecord.status)) {
      clearIdempotencyKey(storageKey)
    }

    return paymentRecord
  },
  getPaymentStatus: async (paymentId?: string) => {
    if (!paymentId) {
      throw new Error('A payment id is required to fetch payment status.')
    }

    const payment = await apiClient.getPayment(paymentId)
    return mapApiPaymentToPaymentRecord(
      payment,
      await resolvePaymentMethodCatalog(payment.payment_method),
    )
  },
}
