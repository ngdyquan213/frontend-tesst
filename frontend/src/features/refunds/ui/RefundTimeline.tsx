import type { RefundRecord } from '@/shared/types/common'

export const RefundTimeline = ({ refund }: { refund: RefundRecord }) => (
  <div className="space-y-4">
    {refund.timeline.map((item) => (
      <div key={`${item.label}-${item.date}`} className="flex gap-4">
        <div className="mt-1 h-3 w-3 rounded-full bg-secondary" />
        <div>
          <div className="font-bold text-primary">{item.label}</div>
          <div className="text-sm text-on-surface-variant">{item.date}</div>
        </div>
      </div>
    ))}
  </div>
)

