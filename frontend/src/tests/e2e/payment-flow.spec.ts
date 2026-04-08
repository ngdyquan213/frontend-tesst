import { expect, test } from '@playwright/test'
import {
  loginThroughUi,
  resolveTourSelection,
  travelerCredentials,
} from './helpers'

test.describe('payment flow', () => {
  test('traveler can choose a method and complete payment', async ({ page, request }) => {
    await loginThroughUi(page, travelerCredentials, '/account')
    const { tourId, scheduleId } = await resolveTourSelection(request)

    await page.goto(`/checkout/payment?tourId=${tourId}&scheduleId=${scheduleId}`)

    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible()

    await page.locator('label').filter({ has: page.locator('input[type="radio"]') }).first().click()
    await page.getByRole('button', { name: 'Pay now' }).click()

    await expect(page).toHaveURL(/\/checkout\/payment\/success\?.*paymentId=/)
    await expect(
      page.getByRole('heading', { name: /Payment (successful|initiated)/ }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /open booking/i })).toBeVisible()
  })
})
