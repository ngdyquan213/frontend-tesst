import type { PaymentMethod } from '@/shared/types/common'
import { Card } from '@/shared/ui/Card'

export const PaymentMethodSelector = ({
  methods,
  selectedId,
  onChange,
}: {
  methods: PaymentMethod[]
  selectedId: string
  onChange: (value: string) => void
}) => (
  <div className="grid gap-4">
    {methods.map((method) => (
      <Card
        key={method.id}
        className={selectedId === method.id ? 'border-primary/30 ring-2 ring-primary/10' : ''}
        onClick={() => onChange(method.id)}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-primary">{method.title}</h3>
            <p className="mt-2 text-sm text-on-surface-variant">{method.description}</p>
          </div>
          <span className="material-symbols-outlined text-primary">{method.icon}</span>
        </div>
      </Card>
    ))}
  </div>
)

