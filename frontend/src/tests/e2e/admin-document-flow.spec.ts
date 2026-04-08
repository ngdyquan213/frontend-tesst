import { expect, test } from '@playwright/test'
import { adminCredentials, loginThroughUi } from './helpers'

test.describe('admin document flow', () => {
  test('admin can review traveler uploads from the moderation queue', async ({ page }) => {
    await loginThroughUi(page, adminCredentials, '/admin')
    await page.goto('/admin/documents')

    await expect(page.getByRole('heading', { name: 'Document Management' })).toBeVisible()

    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()

    const documentTitle = ((await firstRow.locator('td').first().textContent()) ?? '')
      .trim()
      .split('\n')[0]
      ?.trim()
    const row = documentTitle ? page.locator('tr', { hasText: documentTitle }).first() : firstRow
    const statusCell = row.locator('td').nth(2)
    const approveButton = row.getByRole('button', { name: /approve|verified/i })
    const rejectButton = row.getByRole('button', { name: /reject|rejected/i })
    const currentStatus = (await statusCell.textContent())?.trim().toLowerCase() ?? ''

    if (currentStatus.includes('rejected')) {
      await approveButton.click()
      await expect(statusCell).toContainText('verified')
      return
    }

    await rejectButton.click()
    await expect(statusCell).toContainText('rejected')
  })
})
