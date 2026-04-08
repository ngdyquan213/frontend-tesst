import { expect, test } from '@playwright/test'
import { clearBrowserSession, loginThroughUi, travelerCredentials } from './helpers'

test.describe('auth session flow', () => {
  test('traveler must authenticate before reaching account routes and can sign out cleanly', async ({ page }) => {
    await clearBrowserSession(page)

    await page.goto('/account')
    await expect(page).toHaveURL(/\/auth\/login$/)

    await loginThroughUi(page, travelerCredentials, '/account')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    await page.goto('/account/profile')
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()

    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/auth\/login$/)

    await page.goto('/account/documents')
    await expect(page).toHaveURL(/\/auth\/login$/)
  })
})
