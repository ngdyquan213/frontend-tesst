import type { RouteObject } from 'react-router-dom'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import HomePage from '@/pages/public/HomePage'
import ToursPage from '@/pages/public/ToursPage'
import TourDetailPage from '@/pages/public/TourDetailPage'
import TourSchedulesPage from '@/pages/public/TourSchedulesPage'
import { DestinationsPage } from '@/pages/public/DestinationsPage'
import { PromotionsPage } from '@/pages/public/PromotionsPage'
import HelpPage from '@/pages/public/HelpPage'

export const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tours', element: <ToursPage /> },
      { path: 'tours/:slug', element: <TourDetailPage /> },
      { path: 'tours/:slug/schedules', element: <TourSchedulesPage /> },
      { path: 'destinations', element: <DestinationsPage /> },
      { path: 'promotions', element: <PromotionsPage /> },
      { path: 'help', element: <HelpPage /> },
    ],
  },
]

