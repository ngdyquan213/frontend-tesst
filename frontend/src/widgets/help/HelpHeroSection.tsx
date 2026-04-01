import { useEffect, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useHelpTopicsQuery } from '@/features/support/queries/useHelpTopicsQuery'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'

const quickStats = [
  {
    label: 'Response standard',
    value: 'Under 12 hours',
  },
  {
    label: 'Traveler support',
    value: '24/7 for urgent trips',
  },
  {
    label: 'Trust built in',
    value: 'Secure payment guidance',
  },
] as const

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function HelpHeroSection() {
  const topicsQuery = useHelpTopicsQuery()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeQuery = searchParams.get('q') ?? ''
  const [draftQuery, setDraftQuery] = useState(activeQuery)

  useEffect(() => {
    setDraftQuery(activeQuery)
  }, [activeQuery])

  function commitSearch(nextQuery: string) {
    const normalizedQuery = nextQuery.trim()
    const nextSearchParams = new URLSearchParams(searchParams)

    if (normalizedQuery) {
      nextSearchParams.set('q', normalizedQuery)
    } else {
      nextSearchParams.delete('q')
    }

    setSearchParams(nextSearchParams)
    scrollToSection('help-topics')
  }

  return (
    <section className="relative overflow-hidden px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(243,244,245,0.95),rgba(255,255,255,0.92))] px-8 py-12 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:px-14 md:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,242,242,0.18),transparent_28%),radial-gradient(circle_at_top_left,rgba(219,225,255,0.6),transparent_32%)]" />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <Badge variant="teal" size="lg">
              <ShieldCheck className="h-4 w-4" />
              Trusted Travel Support
            </Badge>

            <div className="mt-8 space-y-5">
              <h1 className="font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight text-[color:var(--color-primary)] md:text-7xl">
                How can we help?
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-8 text-[color:var(--color-on-surface-variant)]">
                Find clear guidance for bookings, payments, changes, and refunds, or reach our concierge team for tailored support.
              </p>
            </div>

            <form
              className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-[2rem] border border-[color:var(--color-outline-variant)] bg-white/90 p-3 shadow-[0_22px_50px_rgba(15,23,42,0.08)] md:flex-row md:items-center"
              onSubmit={(event) => {
                event.preventDefault()
                commitSearch(draftQuery)
              }}
            >
              <div className="flex flex-1 items-center gap-3 px-3">
                <Search className="h-5 w-5 text-[color:var(--color-on-surface-variant)]" />
                <input
                  value={draftQuery}
                  onChange={(event) => setDraftQuery(event.target.value)}
                  placeholder="Search booking, refunds, or trip changes..."
                  className="w-full border-none bg-transparent px-0 py-3 text-base text-[color:var(--color-on-surface)] outline-none placeholder:text-[color:var(--color-on-surface-variant)]"
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="min-w-[140px]">
                Search
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {topicsQuery.isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`topic-placeholder-${index}`}
                      className="h-10 w-36 animate-pulse rounded-full bg-white/70"
                    />
                  ))
                : topicsQuery.data?.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => commitSearch(topic.title)}
                      className="rounded-full border border-[color:var(--color-outline-variant)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--color-primary)] transition-colors hover:border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-soft)]"
                    >
                      {topic.title}
                    </button>
                  ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.75rem] border border-white/70 bg-white/80 px-6 py-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-on-surface-variant)]">
                {stat.label}
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
