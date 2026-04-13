import { mapApiRefundToRefundRecord } from '@/shared/lib/appMappers'
import { apiClient } from '@/shared/api/apiClient'
import type { PaginatedResult } from '@/shared/types/pagination'

export const adminRefundsApi = {
  getRefunds: async (
    page = 1,
    pageSize = 10,
  ): Promise<PaginatedResult<ReturnType<typeof mapApiRefundToRefundRecord>>> => {
    const offset = (page - 1) * pageSize
    const response = await apiClient.getAdminRefunds(pageSize, offset)

    return {
      items: response.refunds.map(mapApiRefundToRefundRecord),
      meta: {
        page,
        pageSize,
        total: response.total,
      },
    }
  },
  approveRefund: async (id?: string) => {
    if (!id) {
      throw new Error('Refund id is required.')
    }

    const response = await apiClient.approveRefund(id)
    return mapApiRefundToRefundRecord(response)
  },
}
