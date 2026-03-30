import type { RouteObject } from 'react-router-dom'
import ForbiddenPage from '@/pages/errors/ForbiddenPage'
import NotFoundPage from '@/pages/errors/NotFoundPage'
import ServerErrorPage from '@/pages/errors/ServerErrorPage'

export const errorRoutes: RouteObject[] = [
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '*', element: <NotFoundPage /> },
]

