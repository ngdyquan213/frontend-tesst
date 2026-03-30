interface QuantityFieldProps {
  value: number
  onChange: (value: number) => void
}

export const QuantityField = ({ value, onChange }: QuantityFieldProps) => (
  <div className="flex items-center gap-3 rounded-xl bg-surface-container px-4 py-3">
    <button className="text-primary" onClick={() => onChange(Math.max(1, value - 1))} type="button">
      -
    </button>
    <span className="font-semibold text-primary">{value}</span>
    <button className="text-primary" onClick={() => onChange(value + 1)} type="button">
      +
    </button>
  </div>
)

