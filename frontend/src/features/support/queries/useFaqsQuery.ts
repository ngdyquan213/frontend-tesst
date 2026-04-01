import { useQuery } from '@tanstack/react-query'
import { supportApi } from '@/features/support/api/support.api'
import { supportKeys } from '@/features/support/queries/supportKeys'

export const useFaqsQuery = () =>
  useQuery({
    queryKey: supportKeys.list('faqs'),
    queryFn: supportApi.getFaqs,
  })
