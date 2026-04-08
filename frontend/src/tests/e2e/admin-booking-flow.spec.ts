import { expect, test } from '@playwright/test'
import { adminCredentials, loginThroughUi } from './helpers'

test.describe('admin booking flow', () => {
  test('admin can sign in and open booking management', async ({ page }) => {
    await loginThroughUi(page, adminCredentials, '/admin')

    await page.goto('/admin/bookings')

    await expect(page.getByRole('heading', { name: 'Booking Management' })).toBeVisible()
    await expect(page.locator('tbody tr').first()).toBeVisible()
  })
})
