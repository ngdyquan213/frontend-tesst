import { useState } from 'react'
import { useAdminRefundsQuery } from '@/features/admin/refunds/queries/useAdminRefundsQuery'
import { RefundManagementTable } from '@/features/admin/refunds/ui/RefundManagementTable'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pagination } from '@/shared/ui/Pagination'

const PAGE_SIZE = 10

const RefundManagementPage = () => {
  const [page, setPage] = useState(1)
  const refundsQuery = useAdminRefundsQuery(page, PAGE_SIZE)
  const total = refundsQuery.data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-10">
      <PageHeader title="Refund Management" />
      <RefundManagementTable
        refunds={refundsQuery.data?.items}
        isPending={refundsQuery.isPending}
        errorMessage={
          refundsQuery.isError ? 'We could not load the refund queue right now.' : undefined
        }
      />
      {total > PAGE_SIZE ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  )
}

export default RefundManagementPage
