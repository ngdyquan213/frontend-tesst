import { Outlet } from 'react-router-dom'

export const AuthLayout = () => (
  <div className="grid min-h-screen bg-surface md:grid-cols-[1.1fr_0.9fr]">
    <div className="hidden bg-primary text-white md:flex md:flex-col md:justify-between md:p-12">
      <div className="text-3xl font-extrabold tracking-tight">TravelBook</div>
      <div className="max-w-md">
        <h1 className="mb-4 text-5xl font-extrabold leading-tight">Verified journeys for travelers who plan with confidence.</h1>
        <p className="text-primary-fixed/80">
          Your pages are now connected into a single React experience without redesigning the visual DNA.
        </p>
      </div>
      <div className="text-sm text-primary-fixed/80">Secure booking. Clear documents. Fast support.</div>
    </div>
    <div className="flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-4xl bg-white p-8 shadow-soft">
        <Outlet />
      </div>
    </div>
  </div>
)

