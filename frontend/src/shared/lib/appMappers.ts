import type { Booking as ApiBooking, Payment as ApiPayment, Refund as ApiRefund } from '@/shared/types/api'
import type { Booking, PaymentMethod, PaymentRecord, RefundRecord } from '@/shared/types/common'

const PAYMENT_METHOD_ICON_BY_TYPE: Record<string, PaymentMethod['icon']> = {
  card: 'credit_card',
  bank: 'account_balance',
  wallet: 'account_balance_wallet',
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function normalizeStatus(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

function formatReference(id: string, fallbackPrefix: string) {
  const suffix = id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || '000000'
  return `${fallbackPrefix}-${suffix}`
}

export function mapApiBookingToBooking(apiBooking: ApiBooking): Booking {
  const bookingStatus = normalizeStatus(apiBooking.booking_status || apiBooking.status)
  const paymentStatus = normalizeStatus(apiBooking.payment_status)

  return {
    id: apiBooking.id,
    reference: apiBooking.booking_code || formatReference(apiBooking.id, 'BK'),
    tourId: apiBooking.tour_id ?? '',
    scheduleId: '',
    travelerIds: [],
    status:
      bookingStatus === 'confirmed'
        ? 'confirmed'
        : bookingStatus === 'cancelled'
          ? 'cancelled'
          : bookingStatus === 'completed'
            ? 'confirmed'
            : 'processing',
    total: apiBooking.total_final_amount ?? apiBooking.total_price,
    createdAt: apiBooking.created_at,
    notes:
      paymentStatus.length > 0
        ? `Travel date ${apiBooking.travel_date}. Payment status: ${capitalize(paymentStatus)}.`
        : `Travel date ${apiBooking.travel_date}.`,
  }
}

export function getDefaultPaymentMethods(): PaymentMethod[] {
  return [
    {
      id: 'card',
      type: 'card',
      title: 'Credit Card',
      description: 'Visa, Mastercard, and American Express',
      icon: 'credit_card',
    },
    {
      id: 'bank_transfer',
      type: 'bank',
      title: 'Bank Transfer',
      description: 'Best for higher-value bookings and company trips',
      icon: 'account_balance',
    },
    {
      id: 'wallet',
      type: 'wallet',
      title: 'Travel Wallet',
      description: 'Apply available wallet credits instantly',
      icon: 'account_balance_wallet',
    },
  ]
}

export function mapApiPaymentMethod(raw: Record<string, unknown>): PaymentMethod {
  const normalizedType =
    typeof raw.type === 'string'
      ? raw.type
      : typeof raw.payment_method_type === 'string'
        ? raw.payment_method_type
        : 'card'
  const type = (normalizeStatus(normalizedType) || 'card') as PaymentMethod['type']

  return {
    id: String(raw.id ?? raw.code ?? type),
    type,
    title: String(raw.title ?? raw.name ?? capitalize(type)),
    description: String(raw.description ?? raw.summary ?? `${capitalize(type)} payments are supported.`),
    icon: PAYMENT_METHOD_ICON_BY_TYPE[type] ?? PAYMENT_METHOD_ICON_BY_TYPE.card,
  }
}

export function mapApiPaymentToPaymentRecord(apiPayment: ApiPayment, methods = getDefaultPaymentMethods()): PaymentRecord {
  const matchedMethod = methods.find((method) => method.id === apiPayment.payment_method || method.type === apiPayment.payment_method)
  const paymentStatus = normalizeStatus(apiPayment.payment_status || apiPayment.status)

  return {
    id: apiPayment.id,
    bookingId: apiPayment.booking_id,
    methodId: matchedMethod?.id ?? apiPayment.payment_method ?? methods[0]?.id ?? 'card',
    amount: apiPayment.amount,
    status:
      paymentStatus === 'completed' || paymentStatus === 'success'
        ? 'success'
        : paymentStatus === 'failed' || paymentStatus === 'cancelled'
          ? 'failed'
          : paymentStatus === 'processing'
            ? 'processing'
            : 'pending',
  }
}

function buildRefundTimeline(apiRefund: ApiRefund): RefundRecord['timeline'] {
  if (Array.isArray(apiRefund.timeline) && apiRefund.timeline.length > 0) {
    return apiRefund.timeline.map((item) => ({
      label: item.label,
      date: item.date,
      status: item.status,
    }))
  }

  return [
    {
      label: 'Request created',
      date: apiRefund.created_at,
      status: 'complete',
    },
    {
      label: 'Current status',
      date: apiRefund.updated_at ?? apiRefund.created_at,
      status: normalizeStatus(apiRefund.status) || 'current',
    },
  ]
}

export function mapApiRefundToRefundRecord(apiRefund: ApiRefund): RefundRecord {
  const refundStatus = normalizeStatus(apiRefund.status)

  return {
    id: apiRefund.id,
    bookingId: apiRefund.booking_id ?? '',
    amount: apiRefund.amount,
    status:
      refundStatus === 'paid'
        ? 'paid'
        : refundStatus === 'approved'
          ? 'approved'
          : refundStatus === 'pending' || refundStatus === 'review'
            ? 'review'
            : 'draft',
    reason: apiRefund.reason || 'Refund request submitted.',
    createdAt: apiRefund.created_at,
    timeline: buildRefundTimeline(apiRefund),
  }
}
