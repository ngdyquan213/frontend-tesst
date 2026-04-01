import { ArrowRight, CalendarDays, RefreshCcw, Ticket, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useHelpTopicsQuery } from '@/features/support/queries/useHelpTopicsQuery'
import type { HelpTopic, SupportTopicIconKey } from '@/features/support/model/support.types'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

const topicIconMap: Record<SupportTopicIconKey, LucideIcon> = {
  ticket: Ticket,
  calendar: CalendarDays,
  wallet: Wallet,
  refund: RefreshCcw,
}

function matchesTopic(topic: HelpTopic, normalizedQuery: string) {
  if (!normalizedQuery) {
    return true
  }

  const searchableValues = [topic.title, topic.description, ...topic.bullets, ...topic.searchTerms]

  return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery))
}

function scrollToFaq() {
  document.getElementById('help-faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function HelpTopicsSection() {
  const topicsQuery = useHelpTopicsQuery()
  const [searchParams, setSearchParams] = useSearchParams()
  const normalizedQuery = (searchParams.get('q') ?? '').trim().toLowerCase()

  const visibleTopics = useMemo(
    () => topicsQuery.data?.filter((topic) => matchesTopic(topic, normalizedQuery)) ?? [],
    [normalizedQuery, topicsQuery.data],
  )

  return (
    <section id="help-topics" className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--color-secondary-strong)]">
            Support Topics
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[color:var(--color-primary)]">
            Choose the area where you need clarity
          </h2>
          <p className="max-w-2xl text-base leading-8 text-[color:var(--color-on-surface-variant)]">
            Each topic is designed to answer common traveler questions quickly while keeping a direct support path close at hand.
          </p>
        </div>
        {normalizedQuery ? (
          <p className="text-sm text-[color:var(--color-on-surface-variant)]">
            Showing results for{' '}
            <span className="font-semibold text-[color:var(--color-primary)]">&quot;{searchParams.get('q')}&quot;</span>
          </p>
        ) : null}
      </div>

      {topicsQuery.isLoading ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`help-topic-skeleton-${index}`} className="space-y-6">
              <Skeleton className="h-14 w-14 rounded-[1.5rem]" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-4/6" />
            </Card>
          ))}
        </div>
      ) : null}

      {topicsQuery.isError ? (
        <Card className="mt-10">
          <div className="space-y-4 text-center">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
              We could not load help topics
            </h3>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
              Please refresh the page or try again in a moment. The support contact options below are still available if your request is urgent.
            </p>
            <button
              type="button"
              onClick={() => topicsQuery.refetch()}
              className="inline-flex rounded-full border border-[color:var(--color-primary)] px-5 py-2 text-sm font-semibold text-[color:var(--color-primary)] transition-colors hover:bg-[color:var(--color-primary-soft)]"
            >
              Retry
            </button>
          </div>
        </Card>
      ) : null}

      {!topicsQuery.isLoading && !topicsQuery.isError ? (
        visibleTopics.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {visibleTopics.map((topic) => {
              const Icon = topicIconMap[topic.iconKey]

              return (
                <Card key={topic.id} hoverable className="h-full">
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div className="space-y-5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                          {topic.title}
                        </h3>
                        <p className="text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                          {topic.description}
                        </p>
                      </div>
                      <ul className="space-y-3">
                        {topic.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-center gap-3 text-sm font-medium text-[color:var(--color-on-surface)]"
                          >
                            <span className="h-2 w-2 rounded-full bg-[color:var(--color-secondary-strong)]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextSearchParams = new URLSearchParams(searchParams)
                        nextSearchParams.set('q', topic.title)
                        setSearchParams(nextSearchParams)
                        scrollToFaq()
                      }}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-primary)] transition-all hover:gap-3"
                    >
                      {topic.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="mt-10">
            <div className="space-y-3 text-center">
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                No help topics match that search yet
              </h3>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                Try a broader phrase like booking, refunds, or payments, or use the direct contact options below.
              </p>
            </div>
          </Card>
        )
      ) : null}
    </section>
  )
}
