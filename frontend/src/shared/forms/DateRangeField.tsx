import { Input } from '@/shared/ui/Input'

export const DateRangeField = ({
  start,
  end,
  onChange,
}: {
  start: string
  end: string
  onChange: (value: { start: string; end: string }) => void
}) => (
  <div className="grid gap-3 md:grid-cols-2">
    <Input type="date" value={start} onChange={(event) => onChange({ start: event.target.value, end })} />
    <Input type="date" value={end} onChange={(event) => onChange({ start, end: event.target.value })} />
  </div>
)

