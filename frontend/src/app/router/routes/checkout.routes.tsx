import type { RouteObject } from 'react-router-dom'
import { CheckoutLayout } from '@/app/layouts/CheckoutLayout'
import {
  lazyDefaultPage,
  renderLazyPage,
} from '@/app/router/renderLazyPage'

const CheckoutPage = lazyDefaultPage(() => import('@/pages/checkout/CheckoutPage'))
const PaymentPage = lazyDefaultPage(() => import('@/pages/checkout/PaymentPage'))
const PaymentSuccessPage = lazyDefaultPage(() => import('@/pages/checkout/PaymentSuccessPage'))
const PaymentFailedPage = lazyDefaultPage(() => import('@/pages/checkout/PaymentFailedPage'))

export const checkoutRoutes: RouteObject[] = [
  {
    path: '/checkout',
    element: <CheckoutLayout />,
    children: [
      { index: true, element: renderLazyPage(CheckoutPage) },
      { path: 'payment', element: renderLazyPage(PaymentPage) },
      { path: 'payment/success', element: renderLazyPage(PaymentSuccessPage) },
      { path: 'payment/failed', element: renderLazyPage(PaymentFailedPage) },
    ],
  },
]
