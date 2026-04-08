import { expect, test } from '@playwright/test'
import { isMockMode, resolveTourSelection } from './helpers'

test.describe('booking flow', () => {
  test('traveler can move from a departure selection into checkout', async ({ page, request }) => {
    const { tourId } = await resolveTourSelection(request)

    await page.goto(`/tours/${tourId}/schedules`)

    await expect(page.getByRole('heading', { name: 'Published Schedules' })).toBeVisible()

    await page.getByRole('link', { name: /continue with this departure/i }).first().click()

    await expect(page).toHaveURL(new RegExp(`/checkout\\?tourId=${tourId}&scheduleId=`))
    await expect(page.getByRole('heading', { name: 'Review your trip' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Continue to payment' })).toBeVisible()

    if (isMockMode) {
      await expect(page.getByText('Lead traveler: Alexander Sterling')).toBeVisible()
    }
  })
})
