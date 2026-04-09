import type { PaymentMethod } from '@/shared/types/common'

export function isSupportedCheckoutPaymentMethod(methodId: string) {
  return methodId.trim().length > 0
}

export function filterSupportedCheckoutPaymentMethods(methods: PaymentMethod[]) {
  return methods.filter((method) => isSupportedCheckoutPaymentMethod(method.id))
}
