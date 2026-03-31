export { ROUTES as routePaths } from '@/shared/constants/routes'

export function buildSectionHref(sectionId: string) {
  return `/#${sectionId}`
}

export function buildTourDetailPath(id: string) {
  return ROUTES.public.tourDetail.replace(':id', encodeURIComponent(id))
}

export function buildTourSchedulesPath(id: string) {
  return ROUTES.public.tourSchedules.replace(':id', encodeURIComponent(id))
}