import type { ReactNode } from 'react'

export const FilterPanel = ({ children }: { children: ReactNode }) => (
  <div className="surface-card flex flex-col gap-4 p-6 md:flex-row md:items-end">{children}</div>
)

