import { Button } from '@/shared/ui/Button'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-on-surface-variant">
      Page {page} of {totalPages}
    </span>
    <div className="flex gap-2">
      <Button disabled={page <= 1} variant="outline" onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <Button disabled={page >= totalPages} variant="outline" onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  </div>
)

