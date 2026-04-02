import { useNavigate } from 'react-router-dom'
import { routePaths } from '@/app/router/routePaths'
import { Button } from '@/shared/ui/Button'

export const HeroSection = () => {
  const navigate = useNavigate()

  return (
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
          <Button onClick={() => navigate(routePaths.public.tours)}>Browse tours</Button>
          <Button variant="outline" onClick={() => navigate(routePaths.public.destinations)}>
            View destinations
          </Button>
        </div>
      </div>
      <div className="relative">
        <div className="overflow-hidden rounded-4xl shadow-soft">
          <img
            alt="Mountain lake"
            className="aspect-4/5 h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuABWV97ScoS35wsmCpuWP8psYlOLuZHcCl7hdA8NPuXKjRFeUPaS_cUI-CWzG-d-T3tAV86GxvWxMac6JUwpgpbCZ7vHvT6HClWmJWBBXFFrnwMpmiErgYFIY-nChORRbevXSqQGozTnikLLONbAHUTDjPJdmxoSeGBzXjaDESH-rqchTyq9JvFXk55Hg_hvCc_fBey1YLS1_pCfXtyIEksmuqyNDq1Hz_O8ZfRtIRoPXi32HiQK9kQZOXWHhf-zieZPwMOcAR-6g2Q"
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
}
