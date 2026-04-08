import { ROUTES } from '@/shared/constants/routes'
import { buildQueryString } from '@/shared/lib/buildQueryString'

export { ROUTES as routePaths } from '@/shared/constants/routes'

export function buildSectionHref(sectionId: string) {
  return `/#${sectionId}`
}

function buildCheckoutQueryString(params?: {
  tourId?: string
  scheduleId?: string
  paymentId?: string
}) {
  return buildQueryString({
    tourId: params?.tourId,
    scheduleId: params?.scheduleId,
    paymentId: params?.paymentId,
  })
}

export function buildTourDetailPath(id?: string) {
  if (!id) {
    return ROUTES.public.tours
  }

  return ROUTES.public.tourDetail.replace(':id', encodeURIComponent(id))
}

export function buildTourSchedulesPath(id?: string) {
  if (!id) {
    return ROUTES.public.tours
  }

  return ROUTES.public.tourSchedules.replace(':id', encodeURIComponent(id))
}

export function buildCheckoutPath(params?: { tourId?: string; scheduleId?: string; paymentId?: string }) {
  const queryString = buildCheckoutQueryString(params)

  return queryString ? `${ROUTES.checkout}?${queryString}` : ROUTES.checkout
}

export function buildPaymentPath(params?: { tourId?: string; scheduleId?: string; paymentId?: string }) {
  const queryString = buildCheckoutQueryString(params)

  return queryString ? `${ROUTES.payment}?${queryString}` : ROUTES.payment
}

export function buildPaymentResultPath(
  result: 'success' | 'failed',
  params?: { tourId?: string; scheduleId?: string; paymentId?: string },
) {
  const basePath = result === 'success' ? ROUTES.paymentSuccess : ROUTES.paymentFailed
  const queryString = buildCheckoutQueryString(params)

  return queryString ? `${basePath}?${queryString}` : basePath
}
