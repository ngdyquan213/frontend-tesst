import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'

const NotFoundPage = () => (
  <div className="page-shell py-20">
    <EmptyState title="Page not found" description="The route exists in the old static set, but this URL is not mapped." />
    <div className="mt-6 text-center">
      <Button>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  </div>
)

export default NotFoundPage

