import { Suspense, lazy, type ComponentType } from 'react'
import { LoadingOverlay } from '@/shared/components/LoadingOverlay'

type PageComponent = ComponentType<object>

type ModuleWithDefault<T extends PageComponent> = {
  default: T
}

export function lazyDefaultPage<T extends PageComponent>(
  loader: () => Promise<ModuleWithDefault<T>>,
) {
  return lazy(loader)
}

export function lazyNamedPage<T extends PageComponent, K extends string>(
  loader: () => Promise<Record<K, T>>,
  exportName: K,
) {
  return lazy(async () => {
    const module = await loader()

    return {
      default: module[exportName],
    }
  })
}

export function renderLazyPage(Component: PageComponent) {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <Component />
    </Suspense>
  )
}
