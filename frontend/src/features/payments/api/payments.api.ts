import {
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
  resolvePaymentMethodCatalog,
  type CreatePaymentIntentInput,
} from '@/features/payments/lib/paymentCheckout'
import { mapApiPaymentToPaymentRecord } from '@/shared/lib/appMappers'
import { apiClient } from '@/shared/api/apiClient'
import { resolveMockable } from '@/shared/api/mockApi'
import type { PaymentMethod } from '@/shared/types/common'

export const paymentsApi = {
  getAvailablePaymentMethods: async (): Promise<PaymentMethod[]> =>
    resolveMockable({
      mock: ({ paymentMethods }) => paymentMethods,
      live: () => apiClient.getAvailablePaymentMethods(),
    }),
  createPaymentIntent: async ({
    methodId,
    tourId,
    scheduleId,
    travelerCount,
    travelDate,
  }: CreatePaymentIntentInput) => {
    const input = {
      methodId,
      tourId,
      scheduleId,
      travelerCount,
      travelDate,
    }

    return resolveMockable({
      mock: ({ payments }) => ({
        ...payments[0],
        methodId,
      }),
      live: async () => {
        const { storageKey, idempotencyKey } = getOrCreateIdempotencyKey(input)
        let checkoutResponse
        try {
          checkoutResponse = await apiClient.createTourCheckout({
            schedule_id: scheduleId,
            number_of_travelers: travelerCount,
            payment_method: methodId,
            idempotency_key: idempotencyKey,
          })
        } catch (error) {
          if (
            methodId === 'stripe' &&
            typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            typeof (error as { response?: { status?: unknown } }).response?.status === 'number'
          ) {
            throw new Error('Card payments are not available in this environment right now.')
          }

          throw error
        }
        clearIdempotencyKey(storageKey)
        const payment = checkoutResponse.payment
        const paymentMethods = await resolvePaymentMethodCatalog(payment.payment_method ?? methodId)

        return mapApiPaymentToPaymentRecord(
          {
            ...payment,
            booking_id: checkoutResponse.booking.id,
          },
          paymentMethods,
        )
      },
    })
  },
  getPaymentStatus: async (paymentId?: string) => {
    if (!paymentId) {
      throw new Error('A payment id is required to fetch payment status.')
    }

    return resolveMockable({
      mock: ({ payments }) => payments[0],
      live: async () => {
        const payment = await apiClient.getPayment(paymentId)
        return mapApiPaymentToPaymentRecord(
          payment,
          await resolvePaymentMethodCatalog(payment.payment_method),
        )
      },
    })
  },
}
