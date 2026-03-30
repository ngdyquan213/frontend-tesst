import { useVouchersQuery } from '@/features/vouchers/queries/useVouchersQuery'
import { Card } from '@/shared/ui/Card'

export const VoucherViewer = () => {
  const { data } = useVouchersQuery()
  return (
    <div className="grid gap-4">
      {data?.map((voucher) => (
        <Card key={voucher.id}>
          <h3 className="font-bold text-primary">{voucher.title}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Issued {voucher.issuedAt}</p>
        </Card>
      ))}
    </div>
  )
}

