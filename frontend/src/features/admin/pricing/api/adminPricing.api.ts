import { apiClient } from '@/shared/api/apiClient'
import type { PricingRule } from '@/shared/types/common'

function formatDiscountValue(coupon: Record<string, unknown>) {
  const couponType = String(coupon.coupon_type ?? '').toLowerCase()
  const discountValue = String(coupon.discount_value ?? '')

  if (couponType === 'percentage') {
    return `${discountValue}% off`
  }

  return `${discountValue} off`
}

export const adminPricingApi = {
  getPricing: async (): Promise<PricingRule[]> => {
    const response = await apiClient.getAdminCoupons(50, 0)
    return response.coupons.map((coupon): PricingRule => ({
      id: String(coupon.id ?? ''),
      code: String(coupon.code ?? ''),
      name: `${String(coupon.code ?? 'COUPON')} • ${String(coupon.name ?? 'Untitled rule')}`,
      value: formatDiscountValue(coupon),
      scope: `${String(coupon.applicable_product_type ?? 'all')} • ${coupon.is_active === true ? 'active' : 'inactive'}`,
      couponType: String(coupon.coupon_type ?? ''),
      applicableProductType: String(coupon.applicable_product_type ?? ''),
      discountValue: Number(coupon.discount_value ?? 0),
      isActive: coupon.is_active === true,
    }))
  },
  updatePricingRule: async (payload: { id: string; name: string; discountValue: number; isActive: boolean }): Promise<PricingRule> => {
    const updatedCoupon = await apiClient.updateAdminCoupon(payload.id, {
      name: payload.name,
      discount_value: payload.discountValue,
      is_active: payload.isActive,
    })

    return {
      id: String(updatedCoupon.id ?? payload.id),
      code: String(updatedCoupon.code ?? ''),
      name: `${String(updatedCoupon.code ?? 'COUPON')} • ${String(updatedCoupon.name ?? payload.name)}`,
      value: formatDiscountValue(updatedCoupon),
      scope: `${String(updatedCoupon.applicable_product_type ?? 'all')} • ${updatedCoupon.is_active === true ? 'active' : 'inactive'}`,
      couponType: String(updatedCoupon.coupon_type ?? ''),
      applicableProductType: String(updatedCoupon.applicable_product_type ?? ''),
      discountValue: Number(updatedCoupon.discount_value ?? payload.discountValue),
      isActive: updatedCoupon.is_active === true,
    } satisfies PricingRule
  },
}
