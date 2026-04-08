import { Link, Outlet } from 'react-router-dom'
import { buildTourSchedulesPath } from '@/app/router/routePaths'
import { useCheckoutContext } from '@/widgets/checkout/useCheckoutContext'

export const CheckoutLayout = () => {
  const { tourId, tourName } = useCheckoutContext()

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-outline-variant/10 bg-white/80 backdrop-blur-md">
        <div className="page-shell flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link className="text-2xl font-extrabold tracking-tight text-primary" to="/">
              TravelBook
            </Link>
            <Link
              className="hidden text-sm font-semibold text-on-surface-variant md:inline-flex"
              to={buildTourSchedulesPath(tourId)}
            >
              Back to schedules
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <div className="text-sm font-semibold text-primary">{tourName}</div>
              <div className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                Secure checkout
              </div>
            </div>
            <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              Secure Checkout
            </div>
          </div>
        </div>
      </header>
      <main className="page-shell py-8">
        <Outlet />
      </main>
    </div>
  )
}
