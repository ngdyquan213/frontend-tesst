import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { routePaths } from '@/app/router/routePaths'

const confidencePoints = [
  'No-questions-asked cancellation up to 30 days prior.',
  '100% secure and private transaction handling.',
  'Global travel insurance coverage available.',
] as const

export function BookingConfidenceSection() {
  return (
    <section id={routePaths.sections.bookingConfidence} className="mx-auto mb-24 max-w-7xl px-6 lg:px-8">
      <div className="grid items-center gap-10 rounded-[2rem] bg-[color:var(--color-surface)] p-8 shadow-[var(--shadow-soft)] md:grid-cols-2 md:p-12">
        <div>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQs6CY2ob2Uu5XP-6hNZWPRkg9P8IIpg6yUoE4EgumZvqeED3ezWnXdCvuv6gmxGpfhYxwzjV6VELqDQ4uUis5ACEVJKz-J3tXwVfjVr2JAEesJWocx3I9FRZ4cFa-F8_Y01sSRk_4M1pZlc5O3WEf-uiPe6RnMgDAxXeKtM6717kD1Ulbi0mQuKVtPawYD3FI9A66_BX6TlQXA_Kk9bcxzkYSA1M80sz3MSJdOF6iS2cVXzfqhXcTRGULL7-qMVdu-0PbEts99i2K"
            alt="Professional luxury travel concierge speaking on the phone in a bright office."
            className="h-80 w-full rounded-[28px] object-cover"
          />
        </div>

        <div className="space-y-6">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[color:var(--color-primary)]">
            Booking with Confidence
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-on-surface-variant)]">
            We understand that plans can change. That&apos;s why we offer our industry-leading peace-of-mind guarantee on every single booking.
          </p>
          <ul className="space-y-4">
            {confidencePoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[color:var(--color-secondary-strong)]" />
                <span className="text-sm font-medium text-[color:var(--color-on-surface)]">{point}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="inline-flex items-center gap-2 font-semibold text-[color:var(--color-primary)] transition-all hover:gap-3"
          >
            Learn about our security
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
