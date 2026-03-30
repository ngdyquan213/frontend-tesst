import { Link } from 'react-router-dom'
import type { TourSchedule } from '@/shared/types/common'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { DateText } from '@/shared/components/DateText'
import { CurrencyText } from '@/shared/components/CurrencyText'

const toneByStatus = {
  available: 'success',
  'almost-full': 'warning',
  'sold-out': 'danger',
} as const

export const TourScheduleList = ({ schedules }: { schedules: TourSchedule[] }) => (
  <div className="space-y-4">
    {schedules.map((schedule) => (
      <Card key={schedule.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h4 className="text-lg font-bold text-primary">{schedule.label}</h4>
            <Badge tone={toneByStatus[schedule.status]}>{schedule.status.replace('-', ' ')}</Badge>
          </div>
          <div className="text-sm text-on-surface-variant">
            <DateText value={schedule.startDate} /> - <DateText value={schedule.endDate} />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-sm text-on-surface-variant">{schedule.seatsLeft} seats left</div>
            <div className="text-xl font-extrabold text-primary">
              <CurrencyText value={schedule.price} />
            </div>
          </div>
          <Button>
            <Link to="/checkout">Select</Link>
          </Button>
        </div>
      </Card>
    ))}
  </div>
)

