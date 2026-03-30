import { useAdminOperationsQuery } from '@/features/admin/operations/queries/useAdminOperationsQuery'
import { Card } from '@/shared/ui/Card'

export const OperationsBoard = () => {
  const { data } = useAdminOperationsQuery()
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data?.map((task) => (
        <Card key={task.id}>
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{task.priority}</div>
          <h3 className="text-xl font-bold text-primary">{task.title}</h3>
          <p className="mt-2 text-sm text-on-surface-variant">{task.summary}</p>
        </Card>
      ))}
    </div>
  )
}

