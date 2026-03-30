import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/features/payments/api/payments.api'
import { paymentKeys } from '@/features/payments/queries/paymentKeys'

export const useAvailablePaymentMethodsQuery = () =>
  useQuery({
    queryKey: paymentKeys.list(),
    queryFn: paymentsApi.getAvailablePaymentMethods,
  })

