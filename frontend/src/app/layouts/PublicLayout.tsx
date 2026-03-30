import { Outlet } from 'react-router-dom'
import { MainFooter } from '@/shared/navigation/MainFooter'
import { MainHeader } from '@/shared/navigation/MainHeader'

export const PublicLayout = () => (
  <div className="min-h-screen bg-surface">
    <MainHeader />
    <main className="pb-16 pt-6">
      <Outlet />
    </main>
    <MainFooter />
  </div>
)

