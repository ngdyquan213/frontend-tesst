import { Link, Outlet } from 'react-router-dom'

export const CheckoutLayout = () => (
  <div className="min-h-screen bg-surface">
    <header className="sticky top-0 z-40 border-b border-outline-variant/10 bg-white/80 backdrop-blur-md">
      <div className="page-shell flex h-20 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link className="text-2xl font-extrabold tracking-tight text-primary" to="/">
            TravelBook
          </Link>
          <Link className="hidden text-sm font-semibold text-on-surface-variant md:inline-flex" to="/tours/amalfi-coast-sailing/schedules">
            Back to schedules
          </Link>
        </div>
        <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">Secure Checkout</div>
      </div>
    </header>
    <main className="page-shell py-8">
      <Outlet />
    </main>
  </div>
)

