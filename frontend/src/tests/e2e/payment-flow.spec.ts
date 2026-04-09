import { expect, test } from '@playwright/test'
import {
  LIVE_API_BASE_URL,
  loginApi,
  loginThroughUi,
  resolveTourSelection,
  travelerCredentials,
} from './helpers'

test.describe('payment flow', () => {
  test('traveler can choose a method and reach a valid post-checkout state', async ({ page, request }) => {
    await loginThroughUi(page, travelerCredentials, '/account')
    const { tourId, scheduleId } = await resolveTourSelection(request)

    await page.goto(`/checkout/payment?tourId=${tourId}&scheduleId=${scheduleId}`)

    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible()

    const selfServiceOption = page.locator('label:has(input[type="radio"]:not([value="manual"]))').first()
    if ((await selfServiceOption.count()) > 0) {
      await selfServiceOption.click()
    } else {
      await page.locator('label:has(input[type="radio"])').first().click()
    }

    await page.getByRole('button', { name: /Continue to payment|Create booking request/ }).click()

    await expect(page).toHaveURL(/\/checkout\/payment\/(success|pending)\?.*paymentId=/)

    if (page.url().includes('/checkout/payment/pending')) {
      const paymentId = new URL(page.url()).searchParams.get('paymentId')
      expect(paymentId).toBeTruthy()

      const headers = await loginApi(request, travelerCredentials)
      const simulateResponse = await request.post(
        `${LIVE_API_BASE_URL}/payments/${paymentId}/simulate-success`,
        { headers },
      )

      if (simulateResponse.ok()) {
        await page.getByRole('button', { name: 'Check again' }).click()
        await expect(page).toHaveURL(/\/checkout\/payment\/success\?.*paymentId=/)
      } else {
        await expect(page.getByRole('heading', { name: 'Payment pending' })).toBeVisible()
        return
      }
    }

    await expect(page.getByRole('heading', { name: /Payment (successful|status updating)/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /open booking/i })).toBeVisible()
  })
})
