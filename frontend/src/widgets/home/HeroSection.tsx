import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'

export const HeroSection = () => (
  <section className="page-shell grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
    <div>
      <span className="mb-6 inline-block rounded-full bg-secondary-container px-4 py-1.5 text-xs font-semibold tracking-wider text-on-secondary-container">
        SECURE TRAVEL PLANNING
      </span>
      <h1 className="text-5xl font-extrabold leading-tight text-primary md:text-6xl">
        Reliable tours for the practical traveler.
      </h1>
      <p className="mt-6 max-w-lg text-lg leading-relaxed text-on-surface-variant">
        We simplify travel planning with verified operators, transparent pricing, and 24/7 support.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Button>
          <Link to="/tours">Browse tours</Link>
        </Button>
        <Button variant="outline">
          <Link to="/destinations">View destinations</Link>
        </Button>
      </div>
    </div>
    <div className="relative">
      <div className="overflow-hidden rounded-4xl shadow-soft">
        <img
          alt="Mountain lake"
          className="aspect-4/5 h-full w-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdk7awLRY2bZnS3HXJnqJfCFp0vurdFMlFgdjgEB197bjhTeGuybX6OajfwAbLnAdv902SfwZRCYr2s8_33jcugcBehRS0t1KvSXfgV05S2Ce467TDngVnJ7AMKYzFc8q3-LxdFR60Ps-qEAe5sCw260z5Jlq_vKZz8NhDS24N_-2Kh6How-P2ZzOKfcsydbqgUwuk4krrJ6oVEs8VD_oV2hMGVJWtb2KmGurdUMm0H0xevzDoyt9AccW6dME2rm1z4VGZ8I5tKMAC"
        />
      </div>
      <div className="surface-card absolute -bottom-6 -left-6 max-w-xs p-6">
        <div className="mb-2 flex items-center gap-2 font-bold text-primary">
          <span className="material-symbols-outlined text-secondary">verified</span>
          <span>Verified safety</span>
        </div>
        <p className="text-sm text-on-surface-variant">Every operator passes a multi-point audit before going live.</p>
      </div>
    </div>
  </section>
)

