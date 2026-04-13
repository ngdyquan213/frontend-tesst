import type { AxiosInstance } from 'axios'
import {
  normalizeBooking,
  normalizePayment,
  normalizeRecordArray,
  normalizeRefund,
  toNumber,
} from '@/shared/api/apiNormalizers'
import { mapApiPaymentMethod } from '@/shared/lib/appMappers'
import type { PaymentMethod } from '@/shared/types/common'
import type * as types from '@/shared/types/api'

export function createPaymentRefundsApi(client: AxiosInstance) {
  return {
    async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
      const response = await client.get('/payments/methods')
      const payload = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
          ? response.data.items
          : []

      return payload
        .filter(
          (item: unknown): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object',
        )
        .map(mapApiPaymentMethod)
    },

    async createTourCheckout(data: {
      schedule_id: string
      adult_count: number
      child_count: number
      infant_count: number
      payment_method: string
      idempotency_key: string
    }): Promise<{ booking: types.Booking; payment: types.Payment }> {
      const response = await client.post(
        '/payments/checkout/tours',
        {
          tour_schedule_id: data.schedule_id,
          adult_count: Math.max(data.adult_count, 0),
          child_count: Math.max(data.child_count, 0),
          infant_count: Math.max(data.infant_count, 0),
          payment_method: data.payment_method,
        },
        {
          headers: {
            'Idempotency-Key': data.idempotency_key,
          },
        },
      )

      return {
        booking: normalizeBooking(response.data.booking),
        payment: normalizePayment(response.data.payment),
      }
    },

    async initiatePayment(
      data: types.InitiatePaymentRequest,
    ): Promise<types.InitiatePaymentResponse> {
      const response = await client.post(
        '/payments/initiate',
        {
          booking_id: data.booking_id,
          payment_method: data.payment_method,
        },
        {
          headers: {
            'Idempotency-Key': data.idempotency_key,
          },
        },
      )

      const payment = normalizePayment(response.data)
      return {
        payment_id: payment.id,
        booking_id: payment.booking_id,
        amount: payment.amount,
        payment_status: payment.payment_status,
        created_at: payment.created_at,
      }
    },

    async getPayment(id: string): Promise<types.Payment> {
      const response = await client.get(`/payments/${id}`)
      return normalizePayment(response.data)
    },

    async confirmPayment(paymentId: string): Promise<types.Payment> {
      throw new Error(`Direct payment confirmation is not supported by the live API: ${paymentId}`)
    },

    async getUserRefunds(
      limit = 20,
      offset = 0,
    ): Promise<{ refunds: types.Refund[]; total: number }> {
      const response = await client.get('/refunds', {
        params: { page: Math.floor(offset / limit) + 1, page_size: limit },
      })

      return {
        refunds: normalizeRecordArray(response.data, 'refunds', normalizeRefund),
        total:
          response.data && typeof response.data === 'object' && 'total' in response.data
            ? toNumber((response.data as Record<string, unknown>).total)
            : 0,
      }
    },

    async getRefund(id: string): Promise<types.Refund> {
      const response = await client.get(`/refunds/${id}`)
      return normalizeRefund(response.data)
    },

    async createRefundRequest(payload: {
      reason: string
      booking_id?: string
    }): Promise<types.Refund> {
      const response = await client.post('/refunds', {
        booking_id: payload.booking_id,
        reason: payload.reason,
      })
      return normalizeRefund(response.data)
    },
  }
}
