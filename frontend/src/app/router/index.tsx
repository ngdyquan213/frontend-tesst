import { createBrowserRouter } from 'react-router-dom'
import { accountRoutes } from '@/app/router/routes/account.routes'
import { adminRoutes } from '@/app/router/routes/admin.routes'
import { authRoutes } from '@/app/router/routes/auth.routes'
import { checkoutRoutes } from '@/app/router/routes/checkout.routes'
import { errorRoutes } from '@/app/router/routes/error.routes'
import { publicRoutes } from '@/app/router/routes/public.routes'

export const router = createBrowserRouter([
  ...publicRoutes,
  ...authRoutes,
  ...checkoutRoutes,
  ...accountRoutes,
  ...adminRoutes,
  ...errorRoutes,
])
