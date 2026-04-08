import { Outlet } from 'react-router-dom'

export const AuthLayout = () => (
  <div className="grid min-h-screen bg-[color:var(--color-surface-low)] md:grid-cols-[1.05fr_0.95fr]">
    <div className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#00113a_0%,#001a58_50%,#002366_100%)] text-white md:flex md:flex-col md:justify-between md:p-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,242,242,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(219,225,255,0.16),transparent_32%)]" />
      <div className="relative text-3xl font-extrabold tracking-tight">TravelBook</div>
      <div className="relative max-w-md">
        <h1 className="mb-4 text-5xl font-extrabold leading-tight">
          Verified journeys for travelers who plan with confidence.
        </h1>
        <p className="text-primary-fixed/80">
          Sign in once to manage bookings, documents, payments, and support from one trusted workspace.
        </p>
      </div>
      <div className="relative text-sm text-primary-fixed/80">Secure booking. Clear documents. Fast support.</div>
    </div>
    <div className="relative flex items-center justify-center px-6 py-12 md:px-10 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(219,225,255,0.65),transparent_48%)]" />
      <div className="relative w-full max-w-lg">
        <div className="mb-6 md:hidden">
          <div className="text-3xl font-extrabold tracking-tight text-primary">TravelBook</div>
          <p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">
            Sign in to manage bookings, payments, and post-booking support from one place.
          </p>
        </div>
        <div className="w-full rounded-[2rem] border border-white/80 bg-white p-8 shadow-[0_28px_70px_rgba(15,23,42,0.12)] md:p-10">
          <Outlet />
        </div>
      </div>
    </div>
  </div>
)
