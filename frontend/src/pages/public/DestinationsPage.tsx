import { ArrowRight, Compass, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { routePaths } from '@/app/router/routePaths'
import { DestinationSection } from '@/features/tours'
import { Badge } from '@/shared/ui/Badge'
import { BookingConfidenceSection } from '@/widgets/home/BookingConfidenceSection'
import { PopularDestinationsSection } from '@/widgets/home/PopularDestinationsSection'

const heroHighlights = [
  {
    title: 'Verified operator inventory',
    description:
      'Every destination card is tied to active tour inventory, so discovery flows cleanly into real booking options.',
  },
  {
    title: 'Curated across three regions',
    description:
      'A tighter editorial shortlist spanning the Mediterranean, Northern Europe, and Asia Pacific.',
  },
] as const

export function DestinationsPage() {
  return (
    <>
      <section className="relative overflow-hidden px-6 pb-8 pt-16 lg:px-8 lg:pt-20">
        <div className="absolute inset-x-0 top-0 -z-10 h-[540px] bg-[radial-gradient(circle_at_top_left,rgba(179,197,255,0.32),transparent_32%),radial-gradient(circle_at_top_right,rgba(147,242,242,0.22),transparent_28%)]" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <Badge variant="teal" size="lg">
              <ShieldCheck className="h-4 w-4" />
              Verified destination discovery
            </Badge>

            <div className="space-y-6">
              <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[1.02] tracking-tight text-[color:var(--color-primary)] md:text-7xl">
                Explore destinations with editorial clarity.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--color-on-surface-variant)] md:text-xl">
                Compare verified itineraries across global regions. Find your next journey with transparent operator data, spacious pacing, and a more premium way to browse where TravelBook can take you.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#destination-catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(0,17,58,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-primary-strong)]"
              >
                Browse destination list
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to={routePaths.public.tours}
                className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-outline-variant)] bg-white px-6 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition-colors hover:bg-[color:var(--color-surface-low)]"
              >
                <Compass className="h-4 w-4" />
                View all tours
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {heroHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_48px_-24px_rgba(0,17,58,0.2)] backdrop-blur-md"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-secondary-strong)]">
                    {item.title}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2.25rem] shadow-[0_36px_72px_rgba(15,23,42,0.2)]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIGEBAMkwSFNVJM8exTWciRHLCHux9DxCRXCsXOs2rMM0qQ-DiMLopXzrhPpwzoO16ZhZKP9g3_OtT0xfmlGCLbZx9XwGk4JIymC5Yp4ilEuj2KsSz7tCAZYp1XoU84WNukOCTKENwkBu-FokbRdHE9VyUKJj7LIqN_bwjkNCnGjpTSq2-FfBDj2ufokj-CWVBTy8jq08y6EbI6yBhFgjFE8DDExSDwJ3pP0k9u64UzoWar8o7wsiMZtck-EnAzOOIS40HL4S-5XH_"
                alt="Elegant Mediterranean coastline seen from the water with cliffs, villas, and bright blue sea."
                className="aspect-[4/5] w-full object-cover"
              />
            </div>

            <div className="surface-panel absolute -bottom-8 right-4 max-w-sm rounded-[1.75rem] border border-white/70 p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-secondary-strong)]">
                TravelBook edit
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-[color:var(--color-primary)]">
                A cleaner path from destination inspiration to secure booking.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[color:var(--color-on-surface-variant)]">
                Start with destination mood and region, then move directly into the tours currently published behind each place.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 rounded-[1.5rem] bg-[color:var(--color-surface-low)] p-4">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
                    6
                  </p>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-on-surface-variant)]">
                    destinations
                  </p>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[color:var(--color-primary)]">
                    3
                  </p>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-on-surface-variant)]">
                    regions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DestinationSection />

      <PopularDestinationsSection
        sectionId="popular-destinations"
        eyebrow="Traveler Favorites"
        title="Popular destinations with a sharper shortlist"
        subtitle="A quick editorial pass through the places our travelers keep returning to when they want high-trust planning and polished pacing."
        align="left"
        featuredOnly
        limit={4}
        actionLabel="Browse all destinations"
        actionHref={routePaths.public.destinations}
      />

      <BookingConfidenceSection />
    </>
  )
}
