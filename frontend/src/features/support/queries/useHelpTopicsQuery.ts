import { useQuery } from '@tanstack/react-query'
import { supportApi } from '@/features/support/api/support.api'
import { supportKeys } from '@/features/support/queries/supportKeys'

export const useHelpTopicsQuery = () =>
  useQuery({
    queryKey: supportKeys.list('help-topics'),
    queryFn: supportApi.getHelpTopics,
  })
