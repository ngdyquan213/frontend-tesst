import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'

const ServerErrorPage = () => (
  <div className="page-shell py-20">
    <EmptyState title="Server error" description="Something unexpected happened. Please try again in a moment." />
    <div className="mt-6 text-center">
      <Button>
        <Link to="/">Back to safety</Link>
      </Button>
    </div>
  </div>
)

export default ServerErrorPage

