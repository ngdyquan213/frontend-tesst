import { expect, test } from '@playwright/test'

test.describe('booking flow', () => {
  test('traveler can move from a departure selection into checkout', async ({ page }) => {
    await page.goto('/tours/amalfi-coast-sailing/schedules')

    await expect(page.getByRole('heading', { name: 'Published Schedules' })).toBeVisible()

    await page.getByRole('link', { name: /continue with this departure/i }).first().click()

    await expect(page).toHaveURL(/\/checkout\?tourId=amalfi-coast-sailing&scheduleId=/)
    await expect(page.getByRole('heading', { name: 'Review your trip' })).toBeVisible()
    await expect(page.getByText('Lead traveler: Alexander Sterling')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Continue to payment' })).toBeVisible()
  })
})
