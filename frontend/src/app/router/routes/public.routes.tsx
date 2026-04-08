import type { RouteObject } from 'react-router-dom'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import {
  lazyDefaultPage,
  lazyNamedPage,
  renderLazyPage,
} from '@/app/router/renderLazyPage'

const HomePage = lazyDefaultPage(() => import('@/pages/public/HomePage'))
const ToursPage = lazyNamedPage(() => import('@/pages/public/ToursPage'), 'ToursPage')
const TourDetailPage = lazyNamedPage(
  () => import('@/pages/public/TourDetailPage'),
  'TourDetailPage',
)
const TourSchedulesPage = lazyDefaultPage(() => import('@/pages/public/TourSchedulesPage'))
const DestinationsPage = lazyNamedPage(
  () => import('@/pages/public/DestinationsPage'),
  'DestinationsPage',
)
const PromotionsPage = lazyNamedPage(
  () => import('@/pages/public/PromotionsPage'),
  'PromotionsPage',
)
const HelpPage = lazyDefaultPage(() => import('@/pages/public/HelpPage'))

export const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: renderLazyPage(HomePage) },
      { path: 'tours', element: renderLazyPage(ToursPage) },
      { path: 'tours/:id', element: renderLazyPage(TourDetailPage) },
      { path: 'tours/:id/schedules', element: renderLazyPage(TourSchedulesPage) },
      { path: 'destinations', element: renderLazyPage(DestinationsPage) },
      { path: 'promotions', element: renderLazyPage(PromotionsPage) },
      { path: 'help', element: renderLazyPage(HelpPage) },
    ],
  },
]
