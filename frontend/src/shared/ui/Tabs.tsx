interface TabsProps<T extends string> {
  items: Array<{ key: T; label: string }>
  value: T
  onChange: (value: T) => void
}

export const Tabs = <T extends string>({ items, value, onChange }: TabsProps<T>) => (
  <div className="inline-flex rounded-full bg-surface-container p-1">
    {items.map((item) => (
      <button
        key={item.key}
        className={
          item.key === value
            ? 'rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm'
            : 'rounded-full px-4 py-2 text-sm text-on-surface-variant'
        }
        onClick={() => onChange(item.key)}
        type="button"
      >
        {item.label}
      </button>
    ))}
  </div>
)

