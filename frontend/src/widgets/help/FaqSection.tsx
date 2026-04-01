import { CalendarDays, ChevronDown, CircleHelp, RefreshCcw, Ticket, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFaqsQuery } from '@/features/support/queries/useFaqsQuery'
import type { FaqItem, SupportTopicIconKey } from '@/features/support/model/support.types'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'
import { cn } from '@/shared/lib/cn'

interface FaqGroup {
  topicId: string
  title: string
  iconKey: SupportTopicIconKey
  items: FaqItem[]
}

const iconMap: Record<SupportTopicIconKey, LucideIcon> = {
  ticket: Ticket,
  calendar: CalendarDays,
  wallet: Wallet,
  refund: RefreshCcw,
}

function matchesFaqItem(faq: FaqItem, normalizedQuery: string) {
  if (!normalizedQuery) {
    return true
  }

  return [faq.categoryTitle, faq.question, faq.answer].some((value) =>
    value.toLowerCase().includes(normalizedQuery)
  )
}

function groupFaqs(items: FaqItem[]) {
  const groupedFaqs = new Map<string, FaqGroup>()

  items.forEach((item) => {
    const existingGroup = groupedFaqs.get(item.topicId)

    if (existingGroup) {
      existingGroup.items.push(item)
      return
    }

    groupedFaqs.set(item.topicId, {
      topicId: item.topicId,
      title: item.categoryTitle,
      iconKey: item.categoryIconKey,
      items: [item],
    })
  })

  return Array.from(groupedFaqs.values())
}

export function FaqSection() {
  const faqsQuery = useFaqsQuery()
  const [searchParams] = useSearchParams()
  const normalizedQuery = (searchParams.get('q') ?? '').trim().toLowerCase()
  const [openItemId, setOpenItemId] = useState<string | null>(null)

  const visibleFaqGroups = useMemo(() => {
    const visibleFaqs = faqsQuery.data?.filter((item) => matchesFaqItem(item, normalizedQuery)) ?? []
    return groupFaqs(visibleFaqs)
  }, [faqsQuery.data, normalizedQuery])

  useEffect(() => {
    const currentlyOpenItemStillVisible = visibleFaqGroups.some((group) =>
      group.items.some((item) => item.id === openItemId)
    )

    if (!currentlyOpenItemStillVisible) {
      setOpenItemId(visibleFaqGroups[0]?.items[0]?.id ?? null)
    }
  }, [openItemId, visibleFaqGroups])

  return (
    <section id="help-faq" className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--color-secondary-strong)]">
          Frequently Asked Questions
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[color:var(--color-primary)]">
          Quick answers before you need to reach out
        </h2>
        <p className="max-w-3xl text-base leading-8 text-[color:var(--color-on-surface-variant)]">
          We keep the most common questions visible so travelers can move forward with confidence and only escalate when the situation truly needs a human handoff.
        </p>
      </div>

      {faqsQuery.isLoading ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`faq-group-skeleton-${index}`} className="space-y-5">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : null}

      {faqsQuery.isError ? (
        <Card className="mt-10">
          <div className="space-y-4 text-center">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
              FAQs are temporarily unavailable
            </h3>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
              The help center content could not be loaded right now. You can still use the contact options below while we try again.
            </p>
            <button
              type="button"
              onClick={() => faqsQuery.refetch()}
              className="inline-flex rounded-full border border-[color:var(--color-primary)] px-5 py-2 text-sm font-semibold text-[color:var(--color-primary)] transition-colors hover:bg-[color:var(--color-primary-soft)]"
            >
              Retry
            </button>
          </div>
        </Card>
      ) : null}

      {!faqsQuery.isLoading && !faqsQuery.isError ? (
        visibleFaqGroups.length ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {visibleFaqGroups.map((group) => {
              const Icon = iconMap[group.iconKey]

              return (
                <Card key={group.topicId} className="h-full">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                        {group.title}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {group.items.map((item) => {
                        const isOpen = openItemId === item.id

                        return (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-[1.5rem] border border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-lowest)]"
                          >
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                              onClick={() => setOpenItemId((currentItemId) => (currentItemId === item.id ? null : item.id))}
                            >
                              <span className="pr-4 text-base font-semibold text-[color:var(--color-on-surface)]">
                                {item.question}
                              </span>
                              <ChevronDown
                                className={cn(
                                  'h-5 w-5 flex-shrink-0 text-[color:var(--color-on-surface-variant)] transition-transform duration-300',
                                  isOpen && 'rotate-180'
                                )}
                              />
                            </button>

                            {isOpen ? (
                              <div className="border-t border-[color:var(--color-outline-variant)] px-5 pb-5 pt-4">
                                <p className="text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                                  {item.answer}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="mt-10">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-[color:var(--color-secondary-container)] text-[color:var(--color-secondary-strong)]">
                <CircleHelp className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[color:var(--color-primary)]">
                We do not have a direct FAQ match for that search
              </h3>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                Try another phrase or send your question to support so the team can guide you personally.
              </p>
            </div>
          </Card>
        )
      ) : null}
    </section>
  )
}
