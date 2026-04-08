import { expect, test } from '@playwright/test'
import { adminCredentials, loginThroughUi } from './helpers'

test.describe('admin tour flow', () => {
  test('admin can create and update tour metadata from the management workspace', async ({ page }) => {
    const timestamp = Date.now()
    const originalName = `Pilot Tour ${timestamp}`
    const updatedName = `Pilot Tour ${timestamp} Updated`
    const code = `PILOT_${timestamp}`

    await loginThroughUi(page, adminCredentials, '/admin')
    await page.goto('/admin/tours')

    await expect(page.getByRole('heading', { name: 'Tour Management' })).toBeVisible()

    await page.getByRole('button', { name: /add tour/i }).click()
    await page.getByLabel('Tour code').fill(code)
    await page.getByLabel('Tour name').fill(originalName)
    await page.getByLabel('Destination').fill('Da Nang, Vietnam')
    await page.getByLabel('Duration days').fill('5')
    await page.getByLabel('Duration nights').fill('4')
    await page.getByLabel('Meeting point').fill('Da Nang Airport')
    await page.getByLabel('Tour type').fill('Pilot itinerary')
    await page.getByLabel('Description').fill('A release-candidate tour created by the live E2E suite.')
    await page.getByRole('button', { name: /create tour/i }).click()

    await expect(page.getByText(originalName)).toBeVisible()

    const row = page.locator('tr', { hasText: originalName }).first()
    await row.getByRole('button', { name: /edit/i }).click()

    await page.getByLabel('Tour name').fill(updatedName)
    await page.getByLabel('Destination').fill('Hoi An, Vietnam')
    await page.getByLabel('Status').selectOption('inactive')
    await page.getByLabel('Description').fill('Updated by the live E2E suite to verify admin edit flow.')
    const saveChangesButton = page.getByRole('button', { name: /save changes/i })
    await saveChangesButton.scrollIntoViewIfNeeded()
    await saveChangesButton.click()

    await expect(page.getByText(updatedName)).toBeVisible()
    await expect(page.locator('tr', { hasText: updatedName }).getByText('Inactive')).toBeVisible()
  })
})
