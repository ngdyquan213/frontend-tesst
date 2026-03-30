import { resolveAfter } from '@/shared/api/apiClient'
import { paymentMethods, payments } from '@/shared/api/mockData'

export const paymentsApi = {
  getAvailablePaymentMethods: () => resolveAfter(paymentMethods),
  createPaymentIntent: async (methodId: string) => {
    const payment = payments[0]
    payment.methodId = methodId
    return resolveAfter(payment)
  },
  getPaymentStatus: () => resolveAfter(payments[0]),
}

