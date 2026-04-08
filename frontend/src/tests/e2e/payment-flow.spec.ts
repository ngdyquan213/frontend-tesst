import { expect, test } from '@playwright/test'

test.describe('payment flow', () => {
  test('traveler can choose a method and complete payment', async ({ page }) => {
    await page.goto('/checkout/payment?tourId=amalfi-coast-sailing&scheduleId=schedule-1')

    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible()

    await page.locator('label', { hasText: 'Bank Transfer' }).click()
    await page.getByRole('button', { name: 'Pay now' }).click()

    await expect(page).toHaveURL(
      /\/checkout\/payment\/success\?tourId=amalfi-coast-sailing&scheduleId=.*&paymentId=/,
    )
    await expect(page.getByRole('heading', { name: 'Payment successful' })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in to manage booking/i })).toBeVisible()
  })
})
