import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import DocumentDetailPage from '@/pages/account/DocumentDetailPage'
import DocumentsPage from '@/pages/account/DocumentsPage'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('document flow', () => {
  it('renders document page', () => {
    renderWithProviders(<DocumentsPage />)
    expect(screen.getByText(/documents/i)).toBeInTheDocument()
  })

  it('shows an unavailable state for an unknown document id', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/account/documents/:documentId" element={<DocumentDetailPage />} />
      </Routes>,
      { initialEntries: ['/account/documents/document-missing'] },
    )

    expect(await screen.findByText(/document unavailable/i)).toBeInTheDocument()
  })
})
