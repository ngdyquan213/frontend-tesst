from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictAppException, NotFoundAppException, ValidationAppException
from app.models.coupon import Coupon
from app.models.enums import LogActorType
from app.repositories.coupon_repository import CouponRepository
from app.schemas.admin_coupon import AdminCouponCreateRequest, AdminCouponUpdateRequest
from app.services.admin_bulk_service import AdminBulkService
from app.services.audit_service import AuditService


class AdminCouponService:
    def __init__(
        self,
        *,
        db: Session,
        coupon_repo: CouponRepository,
        audit_service: AuditService,
        admin_bulk_service: AdminBulkService | None = None,
    ) -> None:
        self.db = db
        self.coupon_repo = coupon_repo
        self.audit_service = audit_service
        self.admin_bulk_service = admin_bulk_service

    def _log_action(
        self,
        *,
        actor_user_id,
        action: str,
        resource_type: str,
        ip_address: str | None,
        user_agent: str | None,
        resource_id=None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.audit_service.log_action(
            actor_type=LogActorType.admin,
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata,
        )

    def list_coupons(
        self,
        *,
        skip: int,
        limit: int,
        page: int,
        page_size: int,
        actor_user_id,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[list[Coupon], int]:
        try:
            coupons = self.coupon_repo.list_coupons(skip=skip, limit=limit)
            total = self.coupon_repo.count_coupons()
            self._log_action(
                actor_user_id=actor_user_id,
                action="admin_list_coupons",
                resource_type="coupon",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "page": page,
                    "page_size": page_size,
                    "result_count": len(coupons),
                },
            )
            self.db.commit()
            return coupons, total
        except Exception:
            self.db.rollback()
            raise

    def create_coupon(
        self,
        *,
        payload: AdminCouponCreateRequest,
        actor_user_id,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Coupon:
        if self.coupon_repo.get_by_code(payload.code):
            raise ConflictAppException("Coupon code already exists")

        try:
            with self.db.begin_nested():
                coupon = Coupon(
                    code=payload.code,
                    name=payload.name,
                    coupon_type=payload.coupon_type,
                    applicable_product_type=payload.applicable_product_type,
                    discount_value=payload.discount_value,
                    max_discount_amount=payload.max_discount_amount,
                    min_booking_amount=payload.min_booking_amount,
                    usage_limit_total=payload.usage_limit_total,
                    usage_limit_per_user=payload.usage_limit_per_user,
                    starts_at=payload.starts_at,
                    expires_at=payload.expires_at,
                    is_active=payload.is_active,
                    created_by=actor_user_id,
                    used_count=0,
                )
                self.coupon_repo.add_coupon(coupon)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_create_coupon",
                    resource_type="coupon",
                    resource_id=coupon.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={"code": coupon.code, "name": coupon.name},
                )

            self.db.commit()
            self.db.refresh(coupon)
            return coupon
        except Exception:
            self.db.rollback()
            raise

    def update_coupon(
        self,
        *,
        coupon_id: str,
        payload: AdminCouponUpdateRequest,
        actor_user_id,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Coupon:
        coupon = self.coupon_repo.get_by_id(coupon_id)
        if not coupon:
            raise NotFoundAppException("Coupon not found")

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            raise ValidationAppException("No fields provided for update")

        try:
            with self.db.begin_nested():
                for field, value in update_data.items():
                    setattr(coupon, field, value)
                self.coupon_repo.save_coupon(coupon)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_update_coupon",
                    resource_type="coupon",
                    resource_id=coupon.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={"updated_fields": list(update_data.keys())},
                )

            self.db.commit()
            self.db.refresh(coupon)
            return coupon
        except Exception:
            self.db.rollback()
            raise

    def deactivate_coupon(
        self,
        *,
        coupon_id: str,
        actor_user_id,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Coupon:
        coupon = self.coupon_repo.get_by_id(coupon_id)
        if not coupon:
            raise NotFoundAppException("Coupon not found")

        try:
            with self.db.begin_nested():
                coupon.is_active = False
                self.coupon_repo.save_coupon(coupon)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_deactivate_coupon",
                    resource_type="coupon",
                    resource_id=coupon.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={"code": coupon.code},
                )

            self.db.commit()
            self.db.refresh(coupon)
            return coupon
        except Exception:
            self.db.rollback()
            raise

    def bulk_deactivate_coupons(
        self,
        *,
        coupon_ids: list[str],
        actor_user_id,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> list[dict]:
        if self.admin_bulk_service is None:
            raise ValidationAppException("Bulk admin service is required")

        return self.admin_bulk_service.bulk_deactivate_coupons_with_audit(
            coupon_ids=coupon_ids,
            actor_user_id=actor_user_id,
            action="admin_bulk_deactivate_coupons",
            resource_type="coupon",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "requested_ids": coupon_ids,
            },
        )
