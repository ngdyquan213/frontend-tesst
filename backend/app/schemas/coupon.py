from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import CouponApplicableProductType


class CouponApplyRequest(BaseModel):
    booking_id: str
    coupon_code: str


class CouponApplyResponse(BaseModel):
    booking_id: str
    coupon_id: str
    coupon_code: str
    applicable_product_type: CouponApplicableProductType
    total_base_amount: Decimal
    total_discount_amount: Decimal
    total_final_amount: Decimal
    currency: str
