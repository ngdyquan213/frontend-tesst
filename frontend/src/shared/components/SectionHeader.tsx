interface SectionHeaderProps {
  title: string
  description?: string
}

export const SectionHeader = ({ title, description }: SectionHeaderProps) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-primary">{title}</h2>
    {description ? <p className="mt-2 text-on-surface-variant">{description}</p> : null}
  </div>
)

