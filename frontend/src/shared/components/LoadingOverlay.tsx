import { Spinner } from '@/shared/ui/Spinner'

export const LoadingOverlay = () => (
  <div className="flex items-center justify-center rounded-3xl bg-white/70 p-10">
    <Spinner />
  </div>
)

