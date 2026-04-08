import { useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import { useAdminPricingQuery } from '@/features/admin/pricing/queries/useAdminPricingQuery'
import { useUpdatePricingRuleMutation } from '@/features/admin/pricing/queries/useUpdatePricingRuleMutation'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'

const PricingRuleCard = ({
  rule,
}: {
  rule: {
    id: string
    name: string
    value: string
    scope: string
    discountValue?: number
    isActive?: boolean
  }
}) => {
  const mutation = useUpdatePricingRuleMutation()
  const { pushToast } = useToast()
  const [displayName, setDisplayName] = useState(rule.name)
  const [discountValue, setDiscountValue] = useState(String(rule.discountValue ?? 0))
  const [isActive, setIsActive] = useState(Boolean(rule.isActive))

  return (
    <Card key={rule.id}>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          await mutation.mutateAsync({
            id: rule.id,
            name: displayName.trim(),
            discountValue: Number(discountValue),
            isActive,
          })
          pushToast('Pricing rule updated.', 'success')
        }}
      >
        {mutation.isError ? <Alert tone="danger">{mutation.error.message}</Alert> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Rule name</span>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Discount value</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(event) => setDiscountValue(event.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-bold text-primary">{rule.name}</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              {rule.value} • {rule.scope}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Active
          </label>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={displayName.trim().length === 0 || Number.isNaN(Number(discountValue))}
          >
            Save rule
          </Button>
        </div>
      </form>
    </Card>
  )
}

export const PricingRuleForm = () => {
  const { data } = useAdminPricingQuery()

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No pricing rules available"
        description="When admin coupon rules are available, they will be listed here."
      />
    )
  }

  return (
    <div className="grid gap-4">
      {data?.map((rule) => (
        <PricingRuleCard key={rule.id} rule={rule} />
      ))}
    </div>
  )
}
