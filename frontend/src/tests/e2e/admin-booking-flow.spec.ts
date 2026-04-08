import { expect, test } from '@playwright/test'

test.describe('admin booking flow', () => {
  test('admin can sign in and open booking management', async ({ page }) => {
    await page.goto('/auth/login')

    await page.getByLabel('Email').fill('admin@travelbook.com')
    await page.getByLabel('Password').fill('travel123')
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL('/admin')

    await page.goto('/admin/bookings')

    await expect(page.getByRole('heading', { name: 'Booking Management' })).toBeVisible()
    await expect(page.getByText('BK-9021')).toBeVisible()
  })
})
