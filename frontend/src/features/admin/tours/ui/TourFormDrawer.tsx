import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/app/providers/ToastProvider'
import {
  type AdminTourCreatePayload,
  type AdminTourRecord,
  type AdminTourStatus,
} from '@/features/admin/tours/api/adminTours.api'
import { useCreateTourMutation } from '@/features/admin/tours/queries/useCreateTourMutation'
import { useUpdateTourMutation } from '@/features/admin/tours/queries/useUpdateTourMutation'
import { normalizeApiError } from '@/shared/lib/normalizeApiError'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Textarea } from '@/shared/ui/Textarea'

interface TourFormDrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  tour?: AdminTourRecord | null
  canWrite?: boolean
  onClose: () => void
}

interface TourFormState {
  code: string
  name: string
  destination: string
  description: string
  durationDays: string
  durationNights: string
  meetingPoint: string
  tourType: string
  status: AdminTourStatus
}

function buildInitialState(mode: 'create' | 'edit', tour?: AdminTourRecord | null): TourFormState {
  if (mode === 'edit' && tour) {
    return {
      code: tour.code,
      name: tour.title,
      destination: tour.location,
      description: tour.description,
      durationDays: String(tour.durationDays),
      durationNights: String(tour.durationNights),
      meetingPoint: tour.meetingPoint === 'Not set' ? '' : tour.meetingPoint,
      tourType: tour.tourType === 'General tour' ? '' : tour.tourType,
      status: tour.status,
    }
  }

  return {
    code: '',
    name: '',
    destination: '',
    description: '',
    durationDays: '5',
    durationNights: '4',
    meetingPoint: '',
    tourType: '',
    status: 'active',
  }
}

function toPayload(state: TourFormState): AdminTourCreatePayload {
  return {
    code: state.code.trim(),
    name: state.name.trim(),
    destination: state.destination.trim(),
    description: state.description.trim(),
    durationDays: Number(state.durationDays),
    durationNights: Number(state.durationNights),
    meetingPoint: state.meetingPoint.trim(),
    tourType: state.tourType.trim(),
    status: state.status,
  }
}

export const TourFormDrawer = ({
  open,
  mode,
  tour,
  canWrite = true,
  onClose,
}: TourFormDrawerProps) => {
  const { pushToast } = useToast()
  const createMutation = useCreateTourMutation()
  const updateMutation = useUpdateTourMutation()
  const mutation = mode === 'create' ? createMutation : updateMutation
  const [state, setState] = useState<TourFormState>(() => buildInitialState(mode, tour))

  useEffect(() => {
    if (!open) {
      return
    }

    setState(buildInitialState(mode, tour))
  }, [mode, open, tour])

  const validationError = useMemo(() => {
    const payload = toPayload(state)

    if (mode === 'create' && payload.code.length === 0) {
      return 'Tour code is required.'
    }

    if (payload.name.length === 0 || payload.destination.length === 0) {
      return 'Tour name and destination are required.'
    }

    if (!Number.isInteger(payload.durationDays) || payload.durationDays < 1) {
      return 'Duration days must be at least 1.'
    }

    if (!Number.isInteger(payload.durationNights) || payload.durationNights < 0) {
      return 'Duration nights must be 0 or greater.'
    }

    if (payload.durationNights > payload.durationDays) {
      return 'Duration nights cannot exceed duration days.'
    }

    return null
  }, [mode, state])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canWrite) {
      return
    }

    const payload = toPayload(state)

    if (validationError) {
      return
    }

    if (mode === 'edit') {
      if (!tour) {
        return
      }

      await updateMutation.mutateAsync({
        id: tour.id,
        name: payload.name,
        destination: payload.destination,
        description: payload.description,
        durationDays: payload.durationDays,
        durationNights: payload.durationNights,
        meetingPoint: payload.meetingPoint,
        tourType: payload.tourType,
        status: payload.status,
      })
      pushToast('Tour updated.', 'success')
      onClose()
      return
    }

    await createMutation.mutateAsync(payload)
    pushToast('Tour created.', 'success')
    onClose()
  }

  return (
    <Drawer
      open={open}
      title={mode === 'create' ? 'Create Tour' : `Edit ${tour?.title ?? 'Tour'}`}
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <p className="text-sm text-on-surface-variant">
          Core tour metadata can be updated here. Schedule windows and traveler pricing remain managed
          from the scheduling tools.
        </p>

        {mutation.isError ? <Alert tone="danger">{normalizeApiError(mutation.error)}</Alert> : null}
        {validationError ? <Alert tone="warning">{validationError}</Alert> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Tour code</span>
            <Input
              value={state.code}
              disabled={mode === 'edit'}
              placeholder="TB_AMALFI_2026"
              onChange={(event) => setState((current) => ({ ...current, code: event.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Status</span>
            <Select
              value={state.status}
              onChange={(event) =>
                setState((current) => ({ ...current, status: event.target.value as AdminTourStatus }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Tour name</span>
            <Input
              value={state.name}
              placeholder="Amalfi Coast Sailing"
              onChange={(event) => setState((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Destination</span>
            <Input
              value={state.destination}
              placeholder="Amalfi, Italy"
              onChange={(event) => setState((current) => ({ ...current, destination: event.target.value }))}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Duration days</span>
            <Input
              type="number"
              min="1"
              max="30"
              value={state.durationDays}
              onChange={(event) => setState((current) => ({ ...current, durationDays: event.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Duration nights</span>
            <Input
              type="number"
              min="0"
              max="30"
              value={state.durationNights}
              onChange={(event) => setState((current) => ({ ...current, durationNights: event.target.value }))}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Meeting point</span>
            <Input
              value={state.meetingPoint}
              placeholder="Naples Marina"
              onChange={(event) => setState((current) => ({ ...current, meetingPoint: event.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Tour type</span>
            <Input
              value={state.tourType}
              placeholder="Coastal sailing"
              onChange={(event) => setState((current) => ({ ...current, tourType: event.target.value }))}
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Description</span>
          <Textarea
            value={state.description}
            placeholder="Summarize the route, operator notes, and what operations should know."
            onChange={(event) => setState((current) => ({ ...current, description: event.target.value }))}
          />
        </label>

        {mode === 'edit' && tour ? (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            <p>
              Current published floor price: <span className="font-semibold text-primary">${tour.priceFrom}</span>
            </p>
            <p className="mt-1">Connected schedules: {tour.scheduleCount}</p>
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={Boolean(validationError)}>
            {mode === 'create' ? 'Create tour' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Drawer>
  )
}
