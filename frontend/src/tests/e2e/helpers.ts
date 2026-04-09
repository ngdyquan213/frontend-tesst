import type { APIRequestContext, Page } from '@playwright/test'
import { expect } from '@playwright/test'

const processEnv =
  (
    globalThis as {
      process?: { env?: Record<string, string | undefined> }
    }
  ).process?.env ?? {}

export const LIVE_API_BASE_URL =
  processEnv.VITE_API_BASE_URL ??
  `${processEnv.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000'}/api/v1`

export const isMockMode = processEnv.VITE_ENABLE_MOCKS === 'true'

export const travelerCredentials = {
  email: isMockMode
    ? processEnv.E2E_TRAVELER_EMAIL ?? 'alex@travelbook.com'
    : processEnv.E2E_TRAVELER_EMAIL ?? 'qa.customer@example.com',
  password: isMockMode
    ? processEnv.E2E_TRAVELER_PASSWORD ?? 'travel123'
    : processEnv.E2E_TRAVELER_PASSWORD ?? 'Traveler12345',
}

export const adminCredentials = {
  email: isMockMode
    ? processEnv.E2E_ADMIN_EMAIL ?? 'admin@travelbook.com'
    : processEnv.E2E_ADMIN_EMAIL ?? 'admin@example.com',
  password: isMockMode
    ? processEnv.E2E_ADMIN_PASSWORD ?? 'travel123'
    : processEnv.E2E_ADMIN_PASSWORD ?? 'Admin12345',
}

type LiveTourListResponse = {
  items?: Array<{
    id: string
    schedules?: Array<{
      id: string
      available_slots?: number
    }>
  }>
}

type LiveBookingListResponse = {
  items?: Array<{
    id: string
    booking_code?: string
    status?: string
    payment_status?: string
  }>
}

type LiveRefundListResponse = {
  items?: Array<{
    id?: string
    booking_id?: string
    reason?: string
    status?: string
  }>
}

type RefundableBookingTarget =
  | {
      mode: 'new'
      bookingId: string
    }
  | {
      mode: 'existing'
      bookingId: string
      reason: string
    }

type LoginResponse = {
  access_token: string
}

type CreateSupportTicketResponse = {
  id: string
  reference: string
  subject: string
}

export async function loginThroughUi(
  page: Page,
  credentials: { email: string; password: string },
  expectedPath: string,
) {
  if (isMockMode) {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill(credentials.email)
    await page.getByLabel('Password').fill(credentials.password)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).toHaveURL(expectedPath)
    return
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill(credentials.email)
    await page.getByLabel('Password').fill(credentials.password)

    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/login') &&
        response.request().method() === 'POST',
    )

    await page.getByRole('button', { name: 'Continue' }).click()
    const loginResponse = await loginResponsePromise

    if (loginResponse.status() === 429 && attempt === 0) {
      const retryAfterSeconds = Number(loginResponse.headers()['retry-after'] ?? '1')
      await page.waitForTimeout(Math.max(retryAfterSeconds, 1) * 1000)
      continue
    }

    await expect(page).toHaveURL(expectedPath)
    return
  }
}

export async function clearBrowserSession(page: Page) {
  await page.context().clearCookies()
  await page.goto('/auth/login')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

export async function loginApi(
  request: APIRequestContext,
  credentials: { email: string; password: string },
) {
  const loginResponse = await request.post(`${LIVE_API_BASE_URL}/auth/login`, {
    data: credentials,
    headers: {
      'X-Token-Response-Mode': 'body',
    },
  })
  expect(loginResponse.ok()).toBeTruthy()
  const { access_token: accessToken } = (await loginResponse.json()) as LoginResponse

  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

export async function resolveTourSelection(request: APIRequestContext) {
  if (isMockMode) {
    return {
      tourId: 'amalfi-coast-sailing',
      scheduleId: 'schedule-1',
    }
  }

  const response = await request.get(`${LIVE_API_BASE_URL}/tours`)
  expect(response.ok()).toBeTruthy()
  const payload = (await response.json()) as LiveTourListResponse
  const tour = payload.items?.find((item) => (item.schedules?.length ?? 0) > 0)

  if (!tour) {
    throw new Error('No live tour with schedules is available for E2E verification.')
  }

  const schedule =
    tour.schedules?.find((item) => (item.available_slots ?? 0) > 0) ?? tour.schedules?.[0]

  if (!schedule) {
    throw new Error(`Tour ${tour.id} does not expose a usable schedule for E2E verification.`)
  }

  return {
    tourId: tour.id,
    scheduleId: schedule.id,
  }
}

export async function ensureRefundableBooking(
  request: APIRequestContext,
  reason = 'Operator changed the itinerary after confirmation.',
): Promise<RefundableBookingTarget> {
  if (isMockMode) {
    return { mode: 'new', bookingId: 'booking-2' }
  }

  const headers = await loginApi(request, travelerCredentials)

  const [bookingsResponse, refundsResponse] = await Promise.all([
    request.get(`${LIVE_API_BASE_URL}/bookings`, { headers }),
    request.get(`${LIVE_API_BASE_URL}/refunds`, { headers }),
  ])
  expect(bookingsResponse.ok()).toBeTruthy()
  expect(refundsResponse.ok()).toBeTruthy()

  const bookingsPayload = (await bookingsResponse.json()) as LiveBookingListResponse
  const refundsPayload = (await refundsResponse.json()) as LiveRefundListResponse
  const activeRefunds = (refundsPayload.items ?? []).filter(
    (refund) =>
      refund.booking_id && refund.status !== 'failed' && refund.status !== 'cancelled',
  )
  const activeRefundBookingIds = new Set(
    activeRefunds.map((refund) => refund.booking_id as string),
  )

  const paidBooking = (bookingsPayload.items ?? []).find(
    (booking) =>
      booking.id &&
      booking.status?.toLowerCase() !== 'cancelled' &&
      booking.payment_status?.toLowerCase() === 'paid' &&
      !activeRefundBookingIds.has(booking.id),
  )

  if (paidBooking?.id) {
    return { mode: 'new', bookingId: paidBooking.id }
  }

  const refundedPaidBooking = (bookingsPayload.items ?? []).find(
    (booking) =>
      booking.id &&
      booking.status?.toLowerCase() !== 'cancelled' &&
      booking.payment_status?.toLowerCase() === 'paid' &&
      activeRefundBookingIds.has(booking.id),
  )

  if (refundedPaidBooking?.id) {
    const activeRefund = activeRefunds.find(
      (refund) => refund.booking_id === refundedPaidBooking.id,
    )

    return {
      mode: 'existing',
      bookingId: refundedPaidBooking.id,
      reason: activeRefund?.reason ?? reason,
    }
  }

  const { scheduleId } = await resolveTourSelection(request)
  const checkoutResponse = await request.post(`${LIVE_API_BASE_URL}/payments/checkout/tours`, {
    data: {
      tour_schedule_id: scheduleId,
      adult_count: 1,
      child_count: 0,
      infant_count: 0,
      payment_method: 'manual',
    },
    headers: {
      ...headers,
      'Idempotency-Key': `e2e-refund-${Date.now()}`,
    },
  })
  expect(checkoutResponse.ok()).toBeTruthy()
  const checkoutPayload = (await checkoutResponse.json()) as {
    booking: { id: string }
    payment: { id: string }
  }

  const simulateResponse = await request.post(
    `${LIVE_API_BASE_URL}/payments/${checkoutPayload.payment.id}/simulate-success`,
    { headers },
  )

  if (!simulateResponse.ok()) {
    throw new Error(
      'No paid booking is available for refund E2E and payment simulation is disabled in the live backend.',
    )
  }

  return { mode: 'new', bookingId: checkoutPayload.booking.id }
}

export async function ensureSupportBookingReference(request: APIRequestContext) {
  if (isMockMode) {
    return { bookingReference: 'BK-9021' }
  }

  const headers = await loginApi(request, travelerCredentials)

  const bookingsResponse = await request.get(`${LIVE_API_BASE_URL}/bookings`, { headers })
  expect(bookingsResponse.ok()).toBeTruthy()
  const bookingsPayload = (await bookingsResponse.json()) as LiveBookingListResponse
  const existingBooking = (bookingsPayload.items ?? []).find((booking) => booking.booking_code)

  if (existingBooking?.booking_code) {
    return { bookingReference: existingBooking.booking_code }
  }

  const { scheduleId } = await resolveTourSelection(request)
  const bookingResponse = await request.post(`${LIVE_API_BASE_URL}/bookings/tours`, {
    data: {
      tour_schedule_id: scheduleId,
      adult_count: 1,
      child_count: 0,
      infant_count: 0,
    },
    headers: {
      ...headers,
      'Idempotency-Key': `e2e-booking-${Date.now()}`,
    },
  })
  expect(bookingResponse.ok()).toBeTruthy()
  const bookingPayload = (await bookingResponse.json()) as { booking_code?: string }

  if (!bookingPayload.booking_code) {
    throw new Error('Could not determine a booking reference for support E2E verification.')
  }

  return { bookingReference: bookingPayload.booking_code }
}

export async function seedSupportTicketForAdmin(
  request: APIRequestContext,
  subject?: string,
): Promise<CreateSupportTicketResponse> {
  if (isMockMode) {
    return {
      id: 'ticket-1',
      reference: 'SR-0001',
      subject: subject ?? 'Need marina transfer timing',
    }
  }

  const headers = await loginApi(request, travelerCredentials)
  const { bookingReference } = await ensureSupportBookingReference(request)
  const response = await request.post(`${LIVE_API_BASE_URL}/support/tickets`, {
    headers,
    data: {
      full_name: 'Traveler Support',
      email: travelerCredentials.email,
      topic_id: 'trip-support',
      subject: subject ?? `Operations support follow-up ${Date.now()}`,
      message:
        'Please confirm the latest transfer plan because the traveler support thread now needs an operations reply before departure.',
      booking_reference: bookingReference,
    },
  })

  expect(response.ok()).toBeTruthy()
  const payload = (await response.json()) as CreateSupportTicketResponse
  return payload
}
