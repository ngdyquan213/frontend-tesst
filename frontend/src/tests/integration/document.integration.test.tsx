import { screen } from '@testing-library/react'
import DocumentsPage from '@/pages/account/DocumentsPage'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

describe('document flow', () => {
  it('renders document page', () => {
    renderWithProviders(<DocumentsPage />)
    expect(screen.getByText(/documents/i)).toBeInTheDocument()
  })
})

