import { env } from '@/app/config/env'
import { mapApiPaymentToPaymentRecord } from '@/shared/lib/appMappers'
import { resolveAfter } from '@/shared/api/apiClient'
import { apiClient } from '@/shared/api/apiClient'
import { paymentMethods, payments } from '@/shared/api/mockData'
import { authStorage } from '@/shared/storage/auth.storage'
import type { PaymentMethod } from '@/shared/types/common'

interface CreatePaymentIntentInput {
  methodId: string
  tourId: string
  scheduleId: string
  travelerCount: number
  travelDate: string
}

function buildCheckoutAttemptFingerprint({
  methodId,
  tourId,
  scheduleId,
  travelerCount,
  travelDate,
}: CreatePaymentIntentInput) {
  const accessTokenFragment = (authStorage.getAccessToken() ?? 'guest')
    .slice(0, 24)
    .replace(/[^a-zA-Z0-9_-]/g, '')

  return [accessTokenFragment, methodId, tourId, scheduleId, String(travelerCount), travelDate].join(':')
}

function getCheckoutIdempotencyStorageKey(input: CreatePaymentIntentInput) {
  return `travelbook:checkout-idempotency:${buildCheckoutAttemptFingerprint(input)}`
}

function getOrCreateIdempotencyKey(input: CreatePaymentIntentInput) {
  const storageKey = getCheckoutIdempotencyStorageKey(input)
  const existingKey = sessionStorage.getItem(storageKey)

  if (existingKey) {
    return { storageKey, idempotencyKey: existingKey }
  }

  const idempotencyKey =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `checkout-${crypto.randomUUID()}`
      : `payment-${input.tourId}-${input.scheduleId}-${input.travelerCount}-${Date.now()}`

  sessionStorage.setItem(storageKey, idempotencyKey)
  return { storageKey, idempotencyKey }
}

function clearIdempotencyKey(storageKey: string) {
  sessionStorage.removeItem(storageKey)
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

    const input = {
      methodId,
      tourId,
      scheduleId,
      travelerCount,
      travelDate,
    }
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

    return mapApiPaymentToPaymentRecord(
      {
        ...payment,
        booking_id: checkoutResponse.booking.id,
      },
      await apiClient.getAvailablePaymentMethods(),
    )
  },
  getPaymentStatus: async (paymentId?: string) => {
    if (env.enableMocks) {
      return resolveAfter(payments[0])
    }

    if (!paymentId) {
      throw new Error('A payment id is required to fetch payment status.')
    }

    const payment = await apiClient.getPayment(paymentId)
    return mapApiPaymentToPaymentRecord(payment, await apiClient.getAvailablePaymentMethods())
  },
}
