import { Compass, ShieldCheck, Ticket } from 'lucide-react'

const valuePoints = [
  {
    title: 'Verified Operators',
    description: 'Every offer is paired with tours already vetted for quality, clarity, and secure booking.',
    icon: ShieldCheck,
  },
  {
    title: 'Transparent Windows',
    description: 'Status, timing, and availability stay visible so travelers can judge urgency without guesswork.',
    icon: Ticket,
  },
  {
    title: 'Editorial Curation',
    description: 'Promotions are positioned as premium travel advantages, not cluttered discount noise.',
    icon: Compass,
  },
] as const

export function PromotionHeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-6 pt-12 lg:px-8 lg:pb-8 lg:pt-16">
      <div className="editorial-pattern overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/72 px-8 py-10 shadow-[0_28px_60px_rgba(15,23,42,0.08)] backdrop-blur-md lg:px-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[color:var(--color-secondary-strong)]">
              Current Promotions
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight text-[color:var(--color-primary)] md:text-6xl">
              Premium booking advantages, layered for confident travel planning.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[color:var(--color-on-surface-variant)]">
              Explore active, limited, and archived offers across curated tours. Every promotion keeps its timing, eligibility, and call-to-action clear, so the page feels useful before it feels persuasive.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {valuePoints.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="surface-panel rounded-[1.75rem] border border-white/70 px-5 py-5 shadow-[0_16px_30px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--color-primary)]">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
