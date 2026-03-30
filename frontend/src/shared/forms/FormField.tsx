import type { ReactNode } from 'react'

export const FormField = ({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) => (
  <label className="flex flex-col gap-2">
    <span className="text-xs font-bold uppercase tracking-widest text-primary/60">{label}</span>
    {children}
    {hint ? <span className="text-xs text-on-surface-variant">{hint}</span> : null}
  </label>
)

