import { BadgeCheck, Clock3, Mail, Phone, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { routePaths } from '@/app/router/routePaths'
import { TicketForm } from '@/features/support/ui/TicketForm'
import { Card } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'

interface ContactChannel {
  icon: LucideIcon
  title: string
  detail: string
  caption: string
  href?: string
}

const contactChannels: ContactChannel[] = [
  {
    icon: Mail,
    title: 'Email concierge',
    detail: 'support@travelbook.com',
    caption: 'Ideal for booking, payment, and itinerary questions.',
    href: 'mailto:support@travelbook.com',
  },
  {
    icon: Phone,
    title: 'Traveler hotline',
    detail: '+1 (800) TRAVEL-BK',
    caption: 'Best for urgent departures and same-day changes.',
    href: 'tel:+18008728352',
  },
  {
    icon: Clock3,
    title: 'Coverage window',
    detail: '24/7 urgent care',
    caption: 'Standard inquiries typically receive a first reply within 12 hours.',
  },
]

const trustSignals = [
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    detail: 'Encrypted transactions and careful payment handling.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Tours',
    detail: 'Vetted operators with clearer booking expectations.',
  },
  {
    icon: Mail,
    title: 'Human Support',
    detail: 'Real traveler care when your itinerary needs attention.',
  },
] as const

export function SupportContactSection() {
  const navigate = useNavigate()

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-12 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Card padding="lg" className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--color-secondary-strong)]">
              Need direct assistance?
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[color:var(--color-primary)]">
              Reach support the way that feels easiest
            </h2>
            <p className="max-w-2xl text-base leading-8 text-[color:var(--color-on-surface-variant)]">
              Use the form for a documented follow-up, email us when you want a written thread, or call if your trip is close and timing matters.
            </p>
          </div>

          <div className="grid gap-4">
            {contactChannels.map((channel) => {
              const Icon = channel.icon
              const content = (
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-on-surface-variant)]">
                      {channel.title}
                    </p>
                    <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                      {channel.detail}
                    </p>
                    <p className="text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                      {channel.caption}
                    </p>
                  </div>
                </div>
              )

              if (channel.href) {
                return (
                  <a
                    key={channel.title}
                    href={channel.href}
                    className="rounded-[1.75rem] border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-lowest)] px-5 py-5 transition-colors hover:border-[color:var(--color-primary)]"
                  >
                    {content}
                  </a>
                )
              }

              return (
                <div
                  key={channel.title}
                  className="rounded-[1.75rem] border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-lowest)] px-5 py-5"
                >
                  {content}
                </div>
              )
            })}
          </div>

          <div className="rounded-[1.75rem] bg-[color:var(--color-surface)] px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-secondary-strong)]">
              Best for active travel
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
              If you are departing within 24 hours or are already in transit, the hotline is the fastest path to an urgent handoff.
            </p>
          </div>
        </Card>

        <Card padding="lg">
          <TicketForm />
        </Card>
      </div>

      <div className="mt-10 grid gap-4 rounded-[2rem] bg-[color:var(--color-surface)] p-6 md:grid-cols-3">
        {trustSignals.map((signal) => {
          const Icon = signal.icon

          return (
            <div
              key={signal.title}
              className="flex items-center gap-4 rounded-[1.5rem] bg-white/75 px-5 py-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[color:var(--color-primary)]">
                  {signal.title}
                </p>
                <p className="text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                  {signal.detail}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-10 rounded-[2.25rem] border border-white/70 bg-white/85 px-8 py-12 text-center shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="mx-auto max-w-3xl space-y-4">
          <h3 className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[color:var(--color-primary)]">
            Ready for your next trip?
          </h3>
          <p className="text-base leading-8 text-[color:var(--color-on-surface-variant)]">
            Browse curated tours with clearer booking guidance, or sign in to manage the trips you already have in motion.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button variant="hero" size="xl" onClick={() => navigate(routePaths.public.tours)}>
            Browse Tours
          </Button>
          <Button variant="secondary" size="xl" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    </section>
  )
}
