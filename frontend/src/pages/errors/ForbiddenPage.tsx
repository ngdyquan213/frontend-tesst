import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'

const ForbiddenPage = () => (
  <div className="page-shell py-20">
    <EmptyState title="Forbidden" description="You do not have permission to view this area." />
    <div className="mt-6 text-center">
      <Button>
        <Link to="/">Return home</Link>
      </Button>
    </div>
  </div>
)

export default ForbiddenPage

