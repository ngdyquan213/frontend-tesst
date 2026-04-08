import { expect, test } from '@playwright/test'
import {
  adminCredentials,
  clearBrowserSession,
  ensureSupportBookingReference,
  isMockMode,
  loginThroughUi,
  seedSupportTicketForAdmin,
  travelerCredentials,
} from './helpers'

test.describe('support flow', () => {
  test('traveler can submit a support ticket, open the thread, and send a follow-up', async ({
    page,
    request,
  }) => {
    const { bookingReference } = await ensureSupportBookingReference(request)
    const subject = isMockMode ? 'Need updated marina timing' : `Need updated marina timing ${Date.now()}`
    const message =
      'Please confirm the latest pickup window because the departure notes changed and I need to coordinate arrival timing.'
    const followUp = isMockMode
      ? 'Adding the updated arrival time for the transfer team.'
      : `Adding the updated arrival time for the transfer team ${Date.now()}.`

    await loginThroughUi(page, travelerCredentials, '/account')
    await page.goto('/account/support')

    await page.getByLabel('Full name').fill('Traveler Support')
    await page.getByLabel('Email address').fill(travelerCredentials.email)
    await page.getByLabel('Support topic').selectOption('trip-support')
    await page.getByLabel('Booking reference').selectOption(bookingReference)
    await page.getByLabel('Subject').fill(subject)
    await page.getByLabel('Message').fill(message)
    await page.getByRole('button', { name: 'Send request' }).click()

    await expect(page.getByText(/your request has been received/i)).toBeVisible()
    await expect(page.getByText(subject)).toBeVisible()

    await page.getByRole('button', { name: 'Open thread' }).first().click()
    await page.getByLabel('Reply message').fill(followUp)
    await page.getByRole('button', { name: 'Send follow-up' }).click()

    await expect(page.getByText(followUp)).toBeVisible()
  })

  test('admin can work a support ticket from the operations queue', async ({ page, request }) => {
    const ticket = await seedSupportTicketForAdmin(
      request,
      isMockMode ? 'Need marina transfer timing' : `Operations queue ticket ${Date.now()}`,
    )
    const adminReply = isMockMode
      ? 'Operations confirmed the updated handoff note for this request.'
      : `Operations confirmed the updated handoff note for this request ${Date.now()}.`

    await loginThroughUi(page, adminCredentials, '/admin')
    await page.goto('/admin/operations')

    const queueItem = page.getByRole('button', { name: new RegExp(ticket.subject) }).first()
    await expect(queueItem).toBeVisible()
    await queueItem.click()

    await page.getByLabel('Ticket status').selectOption('waiting_for_traveler')
    await page.getByLabel('Admin reply').fill(adminReply)
    await page.getByRole('button', { name: 'Send admin reply' }).click()

    await expect(page.getByText(adminReply)).toBeVisible()

    await page.getByLabel('Ticket status').selectOption('resolved')
    await page.getByRole('button', { name: 'Apply status' }).click()
    await expect(page.getByLabel('Ticket status')).toHaveValue('resolved')

    if (isMockMode) {
      return
    }

    await clearBrowserSession(page)
    await loginThroughUi(page, travelerCredentials, '/account')
    await page.goto('/account/support')

    await expect(page.getByText(ticket.subject)).toBeVisible()
    await page.getByRole('button', { name: 'Open thread' }).first().click()
    await expect(page.getByText(adminReply)).toBeVisible()
  })
})
