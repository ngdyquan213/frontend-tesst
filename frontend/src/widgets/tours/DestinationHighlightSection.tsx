import type { DestinationHighlight } from '@/features/tours/model/tour.types'
import { Card } from '@/shared/ui/Card'

interface DestinationHighlightSectionProps {
  highlights: DestinationHighlight[]
  eyebrow?: string
  title?: string
  subtitle?: string
  emptyMessage?: string
  columns?: 1 | 2 | 3
}

const columnClasses = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
} as const

export function DestinationHighlightSection({
  highlights,
  eyebrow = 'Destination Focus',
  title = 'Destination Highlights',
  subtitle,
  emptyMessage = 'Visual highlights for this destination are still being prepared.',
  columns = 2,
}: DestinationHighlightSectionProps) {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[color:var(--color-secondary-strong)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[color:var(--color-primary)] md:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--color-on-surface-variant)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {highlights.length === 0 ? (
        <Card className="p-8 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
          {emptyMessage}
        </Card>
      ) : (
        <div className={`grid gap-6 ${columnClasses[columns]}`}>
          {highlights.map((highlight) => (
            <article
              key={highlight.title}
              className="group overflow-hidden rounded-[28px] border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-lowest)] shadow-[0_18px_36px_rgba(15,23,42,0.06)]"
            >
              <div className="h-56 overflow-hidden">
                <img
                  src={highlight.imageUrl}
                  alt={highlight.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="space-y-3 p-6">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                  {highlight.title}
                </h3>
                <p className="text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                  {highlight.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
