import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      {eyebrow ? (
        <span className="mb-3 inline-block rounded-full bg-secondary-container px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-on-secondary-container">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="text-4xl font-extrabold tracking-tight text-primary md:text-5xl">{title}</h1>
      {description ? <p className="mt-3 max-w-3xl text-lg text-on-surface-variant">{description}</p> : null}
    </div>
    {actions}
  </div>
)

