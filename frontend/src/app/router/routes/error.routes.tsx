import type { RouteObject } from 'react-router-dom'
import {
  lazyDefaultPage,
  renderLazyPage,
} from '@/app/router/renderLazyPage'

const ForbiddenPage = lazyDefaultPage(() => import('@/pages/errors/ForbiddenPage'))
const ServerErrorPage = lazyDefaultPage(() => import('@/pages/errors/ServerErrorPage'))
const NotFoundPage = lazyDefaultPage(() => import('@/pages/errors/NotFoundPage'))

export const errorRoutes: RouteObject[] = [
  { path: '/403', element: renderLazyPage(ForbiddenPage) },
  { path: '/500', element: renderLazyPage(ServerErrorPage) },
  { path: '*', element: renderLazyPage(NotFoundPage) },
]
