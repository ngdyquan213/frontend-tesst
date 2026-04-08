import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/features/payments/api/payments.api'
import { paymentKeys } from '@/features/payments/queries/paymentKeys'

export const usePaymentStatusQuery = (paymentId?: string) =>
  useQuery({
    queryKey: paymentKeys.detail(paymentId ?? 'missing'),
    queryFn: () => paymentsApi.getPaymentStatus(paymentId),
    enabled: Boolean(paymentId),
  })
