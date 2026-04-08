import { Buffer } from 'buffer'
import { expect, test } from '@playwright/test'
import { loginThroughUi, travelerCredentials } from './helpers'

function buildUploadName() {
  return `travel-insurance-${Date.now()}.pdf`
}

const validPdfBuffer = Buffer.from(
  '%PDF-1.4\n' +
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
    '3 0 obj\n' +
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\n' +
    'endobj\n' +
    '4 0 obj\n<< /Length 37 >>\nstream\n' +
    'BT /F1 18 Tf 50 120 Td (Test PDF) Tj ET\n' +
    'endstream\nendobj\n' +
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n' +
    'xref\n0 6\n' +
    '0000000000 65535 f \n' +
    '0000000009 00000 n \n' +
    '0000000058 00000 n \n' +
    '0000000115 00000 n \n' +
    '0000000241 00000 n \n' +
    '0000000328 00000 n \n' +
    'trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n398\n%%EOF\n',
)

test.describe('document flow', () => {
  test('traveler can upload a document and open its detail view', async ({ page }) => {
    const fileName = buildUploadName()

    await loginThroughUi(page, travelerCredentials, '/account')
    await page.goto('/account/documents')

    await expect(page.getByRole('heading', { name: 'Documents', level: 1 })).toBeVisible()

    await page.getByLabel('Document type').selectOption('invoice')
    await page.getByLabel('File').setInputFiles({
      name: fileName,
      mimeType: 'application/pdf',
      buffer: validPdfBuffer,
    })

    await page.getByRole('button', { name: /upload document/i }).click()

    await expect(page.getByText(fileName)).toBeVisible()
    await page.getByRole('link', { name: 'View' }).first().click()

    await expect(page).toHaveURL(/\/account\/documents\/.+/)
    await expect(page.getByRole('heading', { name: fileName, level: 1 })).toBeVisible()
  })
})
