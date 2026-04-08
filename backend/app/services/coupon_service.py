from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictAppException, NotFoundAppException, ValidationAppException
from app.models.coupon import CouponUsage
from app.models.enums import BookingItemType, CouponApplicableProductType, CouponType, LogActorType
from app.repositories.booking_repository import BookingRepository
from app.repositories.coupon_repository import CouponRepository
from app.schemas.coupon import CouponApplyRequest
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.utils.enums import enum_to_str


class CouponService(ApplicationService):
    def __init__(
        self,
        db: Session,
        booking_repo: BookingRepository,
        coupon_repo: CouponRepository,
        audit_service: AuditService,
    ) -> None:
        self.db = db
        self.booking_repo = booking_repo
        self.coupon_repo = coupon_repo
        self.audit_service = audit_service

    def _resolve_booking_product_type(self, booking) -> CouponApplicableProductType:
        if not booking.items:
            raise ValidationAppException("Booking has no items")

        item_types = {enum_to_str(item.item_type) for item in booking.items}

        if len(item_types) != 1:
            raise ValidationAppException("Coupon can only be applied to single-product bookings")

        item_type = next(iter(item_types))
        if item_type == BookingItemType.flight.value:
            return CouponApplicableProductType.flight
        if item_type == BookingItemType.hotel.value:
            return CouponApplicableProductType.hotel
        if item_type == BookingItemType.tour.value:
            return CouponApplicableProductType.tour

        raise ValidationAppException("Unsupported booking product type")

    def _validate_coupon(self, *, coupon, booking, user_id: str) -> None:
        if not coupon:
            raise NotFoundAppException("Coupon not found")

        if not coupon.is_active:
            raise ValidationAppException("Coupon is inactive")

        now = datetime.now(timezone.utc)
        if coupon.starts_at and coupon.starts_at > now:
            raise ValidationAppException("Coupon is not active yet")

        if coupon.expires_at and coupon.expires_at < now:
            raise ValidationAppException("Coupon has expired")

        if booking.coupon_id:
            raise ConflictAppException("Booking already has a coupon applied")

        product_type = self._resolve_booking_product_type(booking)
        applicable = enum_to_str(coupon.applicable_product_type)
        if applicable != product_type.value:
            raise ValidationAppException("Coupon is not applicable to this booking type")

        if booking.total_base_amount < coupon.min_booking_amount:
            raise ValidationAppException("Booking amount does not meet coupon minimum")

        if coupon.usage_limit_total is not None and coupon.used_count >= coupon.usage_limit_total:
            raise ValidationAppException("Coupon usage limit reached")

        user_usage_count = self.coupon_repo.count_usage_by_user(str(coupon.id), user_id)
        if (
            coupon.usage_limit_per_user is not None
            and user_usage_count >= coupon.usage_limit_per_user
        ):
            raise ValidationAppException("Coupon usage limit per user reached")

        existing_usage = self.coupon_repo.get_usage_by_booking(str(coupon.id), str(booking.id))
        if existing_usage:
            raise ConflictAppException("Coupon already used for this booking")

    def _calculate_discount_amount(self, *, coupon, booking) -> Decimal:
        coupon_type = enum_to_str(coupon.coupon_type)

        if coupon_type == CouponType.fixed_amount.value:
            discount = Decimal(coupon.discount_value)
        elif coupon_type == CouponType.percentage.value:
            discount = (
                Decimal(booking.total_base_amount) * Decimal(coupon.discount_value)
            ) / Decimal("100")
        else:
            raise ValidationAppException("Unsupported coupon type")

        if coupon.max_discount_amount is not None:
            discount = min(discount, Decimal(coupon.max_discount_amount))

        if discount < Decimal("0.00"):
            discount = Decimal("0.00")

        if discount > Decimal(booking.total_base_amount):
            discount = Decimal(booking.total_base_amount)

        return discount.quantize(Decimal("0.01"))

    def apply_coupon(
        self,
        *,
        user_id: str,
        payload: CouponApplyRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        with self.db.begin_nested():
            booking = self.booking_repo.get_by_id_and_user_id_for_update(
                payload.booking_id,
                user_id,
            )
            if not booking:
                raise ValidationAppException("Booking not found")

            coupon = self.coupon_repo.get_by_code_for_update(payload.coupon_code)
            self._validate_coupon(coupon=coupon, booking=booking, user_id=user_id)

            discount_amount = self._calculate_discount_amount(coupon=coupon, booking=booking)

            booking.coupon_id = coupon.id
            booking.total_discount_amount = discount_amount
            booking.total_final_amount = Decimal(booking.total_base_amount) - discount_amount
            self.booking_repo.save(booking)

            usage = CouponUsage(
                coupon_id=coupon.id,
                user_id=booking.user_id,
                booking_id=booking.id,
            )
            self.coupon_repo.add_usage(usage)

            coupon.used_count += 1
            self.coupon_repo.save_coupon(coupon)

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=booking.user_id,
                action="coupon_applied",
                resource_type="coupon",
                resource_id=coupon.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "booking_id": str(booking.id),
                    "booking_code": booking.booking_code,
                    "coupon_code": coupon.code,
                    "discount_amount": str(discount_amount),
                    "applicable_product_type": enum_to_str(coupon.applicable_product_type),
                },
            )

        self.commit_and_refresh(booking, coupon)
        return booking, coupon
