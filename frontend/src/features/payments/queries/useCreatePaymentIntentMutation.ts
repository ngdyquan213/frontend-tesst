import { useMutation } from '@tanstack/react-query'
import { paymentsApi } from '@/features/payments/api/payments.api'

export const useCreatePaymentIntentMutation = () =>
  useMutation({
    mutationFn: async ({ methodId }: { methodId: string }) => paymentsApi.createPaymentIntent(methodId),
  })

