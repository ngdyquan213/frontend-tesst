import type { PropsWithChildren, ReactNode } from 'react'

interface TableProps {
  columns: string[]
  actionsLabel?: string
  children: ReactNode
}

export const Table = ({ columns, children, actionsLabel = 'Actions' }: PropsWithChildren<TableProps>) => (
  <div className="overflow-hidden rounded-3xl border border-outline-variant/10 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-surface-container-low">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary">
                {column}
              </th>
            ))}
            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-primary">{actionsLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container">{children}</tbody>
      </table>
    </div>
  </div>
)

