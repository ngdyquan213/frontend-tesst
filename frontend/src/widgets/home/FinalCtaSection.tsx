import { Button } from '@/shared/ui/Button'
import { routePaths } from '@/app/router/routePaths'

export function FinalCtaSection() {
  return (
    <section id={routePaths.sections.finalCta} className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="hero-gradient relative overflow-hidden rounded-[2rem] px-8 py-16 text-center text-white shadow-[0_28px_70px_rgba(0,17,58,0.22)] md:px-16 md:py-24">
        <div className="editorial-pattern absolute inset-0 opacity-10" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight md:text-6xl">
            Ready to transcend the ordinary?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[color:var(--color-primary-soft)]">
            Join our circle of global voyagers and receive early access to seasonal tour releases.
          </p>
          <div className="mt-10 flex justify-center">
            <Button variant="soft" size="xl">
              Start Your Journey
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
