import type { PaymentMethod } from '@/shared/types/common'
import { cn } from '@/shared/lib/cn'

export const PaymentMethodSelector = ({
  methods,
  selectedId,
  onChange,
}: {
  methods: PaymentMethod[]
  selectedId: string
  onChange: (value: string) => void
}) => (
  <fieldset className="grid gap-4">
    <legend className="text-sm font-bold uppercase tracking-[0.22em] text-on-surface-variant">
      Choose a payment method
    </legend>
    {methods.map((method) => (
      <label key={method.id} className="block cursor-pointer">
        <input
          type="radio"
          name="payment-method"
          value={method.id}
          checked={selectedId === method.id}
          onChange={() => onChange(method.id)}
          className="sr-only"
        />
        <div
          className={cn(
            'rounded-[28px] border bg-[color:var(--color-surface-lowest)] p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)] transition-all duration-300',
            selectedId === method.id
              ? 'border-primary/30 ring-2 ring-primary/10'
              : 'border-[color:var(--color-outline-variant)] hover:border-primary/20',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-primary">{method.title}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{method.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'material-symbols-outlined text-primary',
                  selectedId === method.id && 'font-bold',
                )}
              >
                {method.icon}
              </span>
              <span
                className="material-symbols-outlined text-primary"
                aria-hidden="true"
              >
                {selectedId === method.id ? 'radio_button_checked' : 'radio_button_unchecked'}
              </span>
            </div>
          </div>
        </div>
      </label>
    ))}
  </fieldset>
)
