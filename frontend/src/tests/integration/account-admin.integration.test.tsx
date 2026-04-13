import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { ProfileForm } from '@/features/profile/ui/ProfileForm'
import { ChangePasswordForm } from '@/features/profile/ui/ChangePasswordForm'
import { profileApi } from '@/features/profile/api/profile.api'
import { PricingRuleForm } from '@/features/admin/pricing/ui/PricingRuleForm'
import { adminPricingApi } from '@/features/admin/pricing/api/adminPricing.api'
import { adminToursApi } from '@/features/admin/tours/api/adminTours.api'
import { useAuthStore } from '@/features/auth/model/auth.store'
import TourManagementPage from '@/pages/admin/TourManagementPage'
import { DocumentReviewTable } from '@/features/admin/documents/ui/DocumentReviewTable'
import { adminDocumentsApi } from '@/features/admin/documents/api/adminDocuments.api'
import type { PaginatedResult } from '@/shared/types/pagination'
import { renderWithProviders } from '@/tests/utils/renderWithProviders'

function buildPaginatedResult<T>(items: T[], page = 1, pageSize = 10): PaginatedResult<T> {
  return {
    items,
    meta: {
      page,
      pageSize,
      total: items.length,
    },
  }
}

function seedAdminSession() {
  useAuthStore.setState({
    user: {
      id: 'admin-1',
      email: 'admin@travelbook.com',
      name: 'Alex Rivera',
      role: 'admin',
      roles: ['admin'],
      permissions: ['admin.tours.read', 'admin.tours.write'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    token: 'mock-access-token:admin-1',
    refreshToken: 'mock-refresh-token:admin-1',
    isAuthenticated: true,
    isInitializing: false,
    isLoading: false,
    error: null,
  })
}

describe('account and admin live forms', () => {
  it('submits profile updates through the live profile mutation', async () => {
    const user = userEvent.setup()
    vi.spyOn(profileApi, 'getProfile').mockResolvedValue({
      id: 'user-1',
      name: 'Traveler One',
      email: 'traveler@example.com',
      emailVerified: true,
      role: 'traveler',
      roles: ['traveler'],
      permissions: [],
      avatar: '',
      title: 'Account Holder',
      initials: 'TO',
      memberId: 'TB-0001',
      location: 'Traveler account',
    })
    const updateProfileSpy = vi.spyOn(profileApi, 'updateProfile').mockResolvedValue({
      id: 'user-1',
      name: 'Traveler Prime',
      email: 'traveler@example.com',
      emailVerified: true,
      role: 'traveler',
      roles: ['traveler'],
      permissions: [],
      avatar: '',
      title: 'Account Holder',
      initials: 'TP',
      memberId: 'TB-0001',
      location: 'Traveler account',
    })

    renderWithProviders(<ProfileForm />)

    const fullNameInput = await screen.findByLabelText(/full name/i)
    await waitFor(() => {
      expect(fullNameInput).toHaveValue('Traveler One')
    })
    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Traveler Prime')
    await user.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => {
      expect(updateProfileSpy).toHaveBeenCalled()
    })
    expect(updateProfileSpy.mock.calls[0]?.[0]).toEqual({ name: 'Traveler Prime' })
  })

  it('submits password changes through the live password mutation', async () => {
    const user = userEvent.setup()
    const changePasswordSpy = vi.spyOn(profileApi, 'changePassword').mockResolvedValue(undefined)

    renderWithProviders(<ChangePasswordForm />)

    await user.type(screen.getByLabelText(/current password/i), 'Password123')
    await user.type(screen.getByLabelText(/new password/i), 'BrandNewPass123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => {
      expect(changePasswordSpy).toHaveBeenCalled()
    })
    expect(changePasswordSpy.mock.calls[0]?.[0]).toEqual({
      currentPassword: 'Password123',
      newPassword: 'BrandNewPass123',
    })
  })

  it('submits admin pricing updates through the coupon update mutation', async () => {
    const user = userEvent.setup()
    vi.spyOn(adminPricingApi, 'getPricing').mockResolvedValue([
      {
        id: 'coupon-1',
        name: 'WELCOME10 • Welcome 10%',
        value: '10% off',
        scope: 'all • active',
        discountValue: 10,
        isActive: true,
      },
    ])
    const updatePricingSpy = vi.spyOn(adminPricingApi, 'updatePricingRule').mockResolvedValue({
      id: 'coupon-1',
      name: 'WELCOME10 • Welcome 15%',
      value: '15% off',
      scope: 'all • active',
      discountValue: 15,
      isActive: true,
    })

    renderWithProviders(<PricingRuleForm />)

    const discountInput = await screen.findByLabelText(/discount value/i)
    await user.clear(discountInput)
    await user.type(discountInput, '15')
    await user.click(screen.getByRole('button', { name: /save rule/i }))

    await waitFor(() => {
      expect(updatePricingSpy).toHaveBeenCalled()
    })
    expect(updatePricingSpy.mock.calls[0]?.[0]).toEqual({
      id: 'coupon-1',
      name: 'WELCOME10 • Welcome 10%',
      discountValue: 15,
      isActive: true,
    })
  })

  it('submits admin document review through the live moderation mutation', async () => {
    const user = userEvent.setup()
    const reviewDocumentSpy = vi.spyOn(adminDocumentsApi, 'reviewDocument').mockResolvedValue({
      id: 'document-1',
      bookingId: 'booking-1',
      title: 'passport.pdf',
      type: 'Passport',
      uploadedAt: '2026-04-08T00:00:00.000Z',
      status: 'verified',
      notes: 'Passport reviewed successfully.',
    })

    renderWithProviders(
      <DocumentReviewTable
        documents={[
          {
            id: 'document-1',
            bookingId: 'booking-1',
            title: 'passport.pdf',
            type: 'Passport',
            uploadedAt: '2026-04-08T00:00:00.000Z',
            status: 'pending',
            notes: 'Passport document for booking booking-1',
          },
        ]}
      />,
    )

    await user.click(await screen.findByRole('button', { name: /approve/i }))

    await waitFor(() => {
      expect(reviewDocumentSpy).toHaveBeenCalled()
    })
    expect(reviewDocumentSpy.mock.calls[0]?.[0]).toEqual({
      documentId: 'document-1',
      status: 'approved',
    })
  })

  it('creates a new admin tour from the management drawer', async () => {
    const user = userEvent.setup()
    seedAdminSession()
    vi.spyOn(adminToursApi, 'getTours').mockResolvedValue(buildPaginatedResult([]))
    const createTourSpy = vi.spyOn(adminToursApi, 'createTour').mockResolvedValue({
      id: 'tour-1',
      code: 'TB_AMALFI_2026',
      title: 'Amalfi Coast Sailing',
      location: 'Amalfi, Italy',
      description: 'Premium coastal route.',
      durationDays: 7,
      durationNights: 6,
      meetingPoint: 'Naples Marina',
      tourType: 'Coastal sailing',
      status: 'active',
      priceFrom: 0,
      scheduleCount: 0,
    })

    renderWithProviders(<TourManagementPage />)

    await user.click(screen.getByRole('button', { name: /add tour/i }))
    await user.type(screen.getByLabelText(/tour code/i), 'TB_AMALFI_2026')
    await user.type(screen.getByLabelText(/tour name/i), 'Amalfi Coast Sailing')
    await user.type(screen.getByLabelText(/destination/i), 'Amalfi, Italy')
    await user.clear(screen.getByLabelText(/duration days/i))
    await user.type(screen.getByLabelText(/duration days/i), '7')
    await user.clear(screen.getByLabelText(/duration nights/i))
    await user.type(screen.getByLabelText(/duration nights/i), '6')
    await user.type(screen.getByLabelText(/meeting point/i), 'Naples Marina')
    await user.type(screen.getByLabelText(/tour type/i), 'Coastal sailing')
    await user.type(screen.getByLabelText(/description/i), 'Premium coastal route.')
    await user.click(screen.getByRole('button', { name: /create tour/i }))

    await waitFor(() => {
      expect(createTourSpy).toHaveBeenCalled()
    })
    expect(createTourSpy.mock.calls[0]?.[0]).toEqual({
      code: 'TB_AMALFI_2026',
      name: 'Amalfi Coast Sailing',
      destination: 'Amalfi, Italy',
      description: 'Premium coastal route.',
      durationDays: 7,
      durationNights: 6,
      meetingPoint: 'Naples Marina',
      tourType: 'Coastal sailing',
      status: 'active',
    })
  })

  it('updates an existing admin tour from the management drawer', async () => {
    const user = userEvent.setup()
    seedAdminSession()
    vi.spyOn(adminToursApi, 'getTours').mockResolvedValue(
      buildPaginatedResult([
        {
          id: 'tour-1',
          code: 'TB_AMALFI_2026',
          title: 'Amalfi Coast Sailing',
          location: 'Amalfi, Italy',
          description: 'Premium coastal route.',
          durationDays: 7,
          durationNights: 6,
          meetingPoint: 'Naples Marina',
          tourType: 'Coastal sailing',
          status: 'active',
          priceFrom: 1299,
          scheduleCount: 2,
        },
      ]),
    )
    const updateTourSpy = vi.spyOn(adminToursApi, 'updateTour').mockResolvedValue({
      id: 'tour-1',
      code: 'TB_AMALFI_2026',
      title: 'Amalfi Coast Sailing Plus',
      location: 'Positano, Italy',
      description: 'Updated coastal route.',
      durationDays: 8,
      durationNights: 7,
      meetingPoint: 'Positano Marina',
      tourType: 'Premium sailing',
      status: 'inactive',
      priceFrom: 1299,
      scheduleCount: 2,
    })

    renderWithProviders(<TourManagementPage />)

    await user.click(await screen.findByRole('button', { name: /edit/i }))
    const destinationInput = screen.getByLabelText(/destination/i)
    await user.clear(screen.getByLabelText(/tour name/i))
    await user.type(screen.getByLabelText(/tour name/i), 'Amalfi Coast Sailing Plus')
    await user.clear(destinationInput)
    await user.type(destinationInput, 'Positano, Italy')
    await user.clear(screen.getByLabelText(/duration days/i))
    await user.type(screen.getByLabelText(/duration days/i), '8')
    await user.clear(screen.getByLabelText(/duration nights/i))
    await user.type(screen.getByLabelText(/duration nights/i), '7')
    await user.clear(screen.getByLabelText(/meeting point/i))
    await user.type(screen.getByLabelText(/meeting point/i), 'Positano Marina')
    await user.clear(screen.getByLabelText(/tour type/i))
    await user.type(screen.getByLabelText(/tour type/i), 'Premium sailing')
    await user.clear(screen.getByLabelText(/description/i))
    await user.type(screen.getByLabelText(/description/i), 'Updated coastal route.')
    await user.selectOptions(screen.getByLabelText(/status/i), 'inactive')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(updateTourSpy).toHaveBeenCalled()
    })
    expect(updateTourSpy.mock.calls[0]?.[0]).toEqual({
      id: 'tour-1',
      name: 'Amalfi Coast Sailing Plus',
      destination: 'Positano, Italy',
      description: 'Updated coastal route.',
      durationDays: 8,
      durationNights: 7,
      meetingPoint: 'Positano Marina',
      tourType: 'Premium sailing',
      status: 'inactive',
    })
  })
})
