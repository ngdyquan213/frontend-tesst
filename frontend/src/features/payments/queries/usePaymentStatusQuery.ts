import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/features/payments/api/payments.api'
import { paymentKeys } from '@/features/payments/queries/paymentKeys'

interface PaymentStatusQueryOptions {
  refetchInterval?: number | false
}

export const usePaymentStatusQuery = (
  paymentId?: string,
  options?: PaymentStatusQueryOptions,
) =>
  useQuery({
    queryKey: paymentKeys.detail(paymentId ?? 'missing'),
    queryFn: () => paymentsApi.getPaymentStatus(paymentId),
    enabled: Boolean(paymentId),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: Boolean(options?.refetchInterval),
  })
