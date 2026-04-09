import type { PaymentMethod } from '@/shared/types/common'

const SUPPORTED_CHECKOUT_PAYMENT_METHOD_IDS = new Set(['manual'])

export function isSupportedCheckoutPaymentMethod(methodId: string) {
  return SUPPORTED_CHECKOUT_PAYMENT_METHOD_IDS.has(methodId)
}

export function filterSupportedCheckoutPaymentMethods(methods: PaymentMethod[]) {
  return methods.filter((method) => isSupportedCheckoutPaymentMethod(method.id))
}
