import { expect, test } from '@playwright/test'

test.describe('refund flow', () => {
  test('traveler can sign in and submit a refund request', async ({ page }) => {
    const reason = 'Operator changed the itinerary after confirmation.'

    await page.goto('/auth/login')

    await page.getByLabel('Email').fill('alex@travelbook.com')
    await page.getByLabel('Password').fill('travel123')
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL('/account')

    await page.goto('/account/refunds')
    await page.getByLabel('Reason').fill(reason)
    await page.getByRole('button', { name: 'Submit request' }).click()

    await expect(page.getByText(reason)).toBeVisible()
  })
})
