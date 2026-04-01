import { CalendarCheck2, Map, Search } from 'lucide-react'
import { routePaths } from '@/app/router/routePaths'
import { SectionHeader } from '@/shared/components/SectionHeader'

const steps = [
  {
    title: '01. Discover',
    description: 'Browse our meticulously curated collection of boutique tours and hidden gems.',
    icon: Search,
    color: 'bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]',
  },
  {
    title: '02. Book',
    description: 'Secure your spot with a simple, encrypted booking process and instant confirmation.',
    icon: CalendarCheck2,
    color: 'bg-[color:var(--color-secondary-soft)] text-[color:var(--color-secondary-strong)]',
  },
  {
    title: '03. Experience',
    description: 'Travel with confidence, backed by 24/7 local support and verified guides.',
    icon: Map,
    color: 'bg-[color:var(--color-tertiary-soft)] text-[color:var(--color-primary)]',
  },
] as const

export function HowItWorksSection() {
  return (
    <section id={routePaths.sections.howItWorks} className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="grid gap-16 md:grid-cols-[0.35fr_0.65fr]">
        <div>
          <SectionHeader
            title="Seamlessly Engineered for You"
            subtitle="We've removed the complexity from luxury travel. Your only task is to decide where your heart wants to go."
          />
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon

            return (
              <article key={step.title} className="space-y-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${step.color}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                  {step.title}
                </h3>
                <p className="text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                  {step.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
