import { apiClient } from '@/shared/api/apiClient'
import { resolveMockable } from '@/shared/api/mockApi'

function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export const vouchersApi = {
  getVouchers: async () =>
    resolveMockable({
      mock: ({ vouchers }) => vouchers,
      live: async () => {
        const response = await apiClient.getUserBookings(50, 0)
        return response.bookings.map((booking) => ({
          id: booking.id,
          bookingId: booking.id,
          title: `Voucher for ${booking.booking_code ?? booking.id}`,
          downloadLabel: 'Download PDF',
          issuedAt: booking.booked_at ?? booking.created_at,
        }))
      },
    }),
  downloadVoucher: async (id: string) =>
    resolveMockable({
      mock: ({ vouchers }) => vouchers.find((voucher) => voucher.id === id),
      live: async () => {
        const blob = await apiClient.downloadVoucherPdf(id)
        triggerDownload(blob, `voucher-${id}.pdf`)
        return { id }
      },
    }),
}
