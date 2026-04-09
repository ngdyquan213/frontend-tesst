import type { ReactNode } from 'react'

export const FormField = ({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) => (
  <label className="flex flex-col gap-2">
    <span className="text-xs font-bold uppercase tracking-widest text-primary/60">{label}</span>
    {children}
    {error ? <span className="text-xs text-red-600">{error}</span> : null}
    {!error && hint ? <span className="text-xs text-on-surface-variant">{hint}</span> : null}
  </label>
)
