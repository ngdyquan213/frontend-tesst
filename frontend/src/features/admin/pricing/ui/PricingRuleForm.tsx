import { useAdminPricingQuery } from '@/features/admin/pricing/queries/useAdminPricingQuery'
import { Card } from '@/shared/ui/Card'

export const PricingRuleForm = () => {
  const { data } = useAdminPricingQuery()
  return (
    <div className="grid gap-4">
      {data?.map((rule) => (
        <Card key={rule.id}>
          <h3 className="font-bold text-primary">{rule.name}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            {rule.value} • {rule.scope}
          </p>
        </Card>
      ))}
    </div>
  )
}

