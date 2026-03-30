import type { PropsWithChildren } from 'react'

export const Tooltip = ({ label, children }: PropsWithChildren<{ label: string }>) => (
  <span title={label}>{children}</span>
)

