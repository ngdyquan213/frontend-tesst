from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import CouponApplicableProductType, CouponType


class AdminCouponCreateRequest(BaseModel):
    code: str
    name: str
    coupon_type: CouponType
    applicable_product_type: CouponApplicableProductType = CouponApplicableProductType.all
    discount_value: Decimal
    max_discount_amount: Decimal | None = None
    min_booking_amount: Decimal = Decimal("0")
    usage_limit_total: int | None = None
    usage_limit_per_user: int | None = None
    starts_at: datetime | None = None
    expires_at: datetime | None = None
    is_active: bool = True


class AdminCouponUpdateRequest(BaseModel):
    name: str | None = None
    applicable_product_type: CouponApplicableProductType | None = None
    discount_value: Decimal | None = None
    max_discount_amount: Decimal | None = None
    min_booking_amount: Decimal | None = None
    usage_limit_total: int | None = None
    usage_limit_per_user: int | None = None
    starts_at: datetime | None = None
    expires_at: datetime | None = None
    is_active: bool | None = None


class AdminCouponResponse(BaseModel):
    id: str
    code: str
    name: str
    coupon_type: CouponType
    applicable_product_type: CouponApplicableProductType
    discount_value: str
    max_discount_amount: str | None = None
    min_booking_amount: str
    usage_limit_total: int | None = None
    usage_limit_per_user: int | None = None
    used_count: int
    is_active: bool
