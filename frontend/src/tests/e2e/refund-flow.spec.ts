import { expect, test } from '@playwright/test'
import { ensureRefundableBooking, isMockMode, loginThroughUi, travelerCredentials } from './helpers'

test.describe('refund flow', () => {
  test('traveler can sign in and submit a refund request', async ({ page, request }) => {
    const reason = 'Operator changed the itinerary after confirmation.'
    const refundTarget = await ensureRefundableBooking(request, reason)

    await loginThroughUi(page, travelerCredentials, '/account')

    await page.goto('/account/refunds')

    if (refundTarget.mode === 'existing') {
      await expect(page.getByText(refundTarget.reason)).toBeVisible()
      return
    }

    await page.getByLabel('Booking').selectOption(refundTarget.bookingId)
    await page.getByLabel('Reason').fill(reason)
    await page.getByRole('button', { name: 'Submit request' }).click()

    await expect(page.getByText(/refund request created/i)).toBeVisible()

    if (isMockMode) {
      return
    }
  })
})
