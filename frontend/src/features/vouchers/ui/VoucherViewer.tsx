import { useVouchersQuery } from '@/features/vouchers/queries/useVouchersQuery'
import { VoucherDownloadButton } from '@/features/vouchers/ui/VoucherDownloadButton'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'

export const VoucherViewer = () => {
  const { data } = useVouchersQuery()

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No vouchers yet"
        description="Vouchers will appear after bookings become eligible for voucher generation."
      />
    )
  }

  return (
    <div className="grid gap-4">
      {data?.map((voucher) => (
        <Card key={voucher.id}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-bold text-primary">{voucher.title}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">Issued {voucher.issuedAt}</p>
            </div>
            <VoucherDownloadButton voucherId={voucher.id} />
          </div>
        </Card>
      ))}
    </div>
  )
}
