import { Quote } from 'lucide-react'
import { routePaths } from '@/app/router/routePaths'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { Card } from '@/shared/ui/Card'

const testimonials = [
  {
    quote:
      'The attention to detail was unparalleled. Every aspect of our Swiss tour was handled with such grace. Truly a premium experience from start to finish.',
    name: 'Eleanor Vance',
    location: 'London, UK',
  },
  {
    quote:
      "TravelBook didn't just book a trip; they curated a memory. The local guides in Vietnam were insightful and passionate. Simply incredible.",
    name: 'Jameson Thorne',
    location: 'New York, USA',
  },
  {
    quote:
      "The easiest booking experience I've ever had. Their 24/7 support helped us navigate a flight delay within minutes. Total peace of mind.",
    name: 'Sienna Blake',
    location: 'Sydney, AU',
  },
] as const

export function TestimonialsSection() {
  return (
    <section id={routePaths.sections.testimonials} className="bg-white/60 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader title="The Voyager's Word" align="center" />
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="relative">
              <Quote className="absolute left-6 top-6 h-10 w-10 text-secondary-container" />
              <p className="relative z-10 pt-10 text-sm italic leading-7 text-on-surface-variant">
                "{testimonial.quote}"
              </p>
              <div className="mt-6 flex items-center gap-4 border-t border-outline-variant pt-6 not-italic">
                <div className="h-12 w-12 rounded-full bg-slate-200" />
                <div>
                  <p className="font-(family-name:--font-display) font-bold text-primary">
                    {testimonial.name}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
