import { apiClient } from '@/shared/api/apiClient'
import { authStorage } from '@/shared/storage/auth.storage'
import type { PaymentMethod } from '@/shared/types/common'

interface CreatePaymentIntentInput {
  methodId: string
  tourId: string
  scheduleId: string
  travelerCount: number
  travelDate: string
}

function getSessionStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage
  } catch {
    return null
  }
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

export function getOrCreateIdempotencyKey(input: CreatePaymentIntentInput) {
  const storageKey = getCheckoutIdempotencyStorageKey(input)
  const sessionStorage = getSessionStorage()
  const existingKey = sessionStorage?.getItem(storageKey)

  if (existingKey) {
    return { storageKey, idempotencyKey: existingKey }
  }

  const idempotencyKey =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `checkout-${crypto.randomUUID()}`
      : `payment-${input.tourId}-${input.scheduleId}-${input.travelerCount}-${Date.now()}`

  sessionStorage?.setItem(storageKey, idempotencyKey)
  return { storageKey, idempotencyKey }
}

export function clearIdempotencyKey(storageKey: string) {
  getSessionStorage()?.removeItem(storageKey)
}

export async function resolvePaymentMethodCatalog(preferredMethodId?: string) {
  try {
    return await apiClient.getAvailablePaymentMethods()
  } catch {
    if (!preferredMethodId) {
      return []
    }

    return [
      {
        id: preferredMethodId,
        type: preferredMethodId === 'manual' ? 'bank' : preferredMethodId === 'stripe' ? 'card' : 'wallet',
        title:
          preferredMethodId === 'manual'
            ? 'Manual Settlement'
            : preferredMethodId === 'stripe'
              ? 'Card via Stripe'
              : preferredMethodId.toUpperCase(),
        description: 'Payment method details are temporarily unavailable.',
        icon:
          preferredMethodId === 'manual'
            ? 'account_balance'
            : preferredMethodId === 'stripe'
              ? 'credit_card'
              : 'account_balance_wallet',
      },
    ] satisfies PaymentMethod[]
  }
}

export type { CreatePaymentIntentInput }
