import { Map, ShieldCheck, Smile, UserRoundCheck } from 'lucide-react'

const trustItems = [
  {
    title: 'Secure Payments',
    subtitle: 'Bank-grade encryption',
    icon: ShieldCheck,
  },
  {
    title: '24/7 Support',
    subtitle: 'Real-time concierge',
    icon: UserRoundCheck,
  },
  {
    title: 'Verified Tours',
    subtitle: 'Directly vetted partners',
    icon: Map,
  },
  {
    title: 'Happiness Guarantee',
    subtitle: 'Flexible cancellation',
    icon: Smile,
  },
] as const

export function TrustStrip() {
  return (
    <section className="bg-(--color-surface-low) py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {trustItems.map((item) => {
          const Icon = item.icon

          return (
            <div key={item.title} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-(--color-secondary-strong) shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-(family-name:--font-display) text-lg font-bold text-primary">
                  {item.title}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                  {item.subtitle}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
