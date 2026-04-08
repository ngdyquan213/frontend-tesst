from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictAppException, NotFoundAppException, ValidationAppException
from app.models.enums import BookingStatus, LogActorType, PaymentStatus, RefundStatus
from app.repositories.admin_repository import AdminRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService
from app.utils.enums import enum_to_str


class AdminService:
    def __init__(
        self,
        db: Session,
        user_repo: UserRepository,
        admin_repo: AdminRepository,
        payment_repo: PaymentRepository | None = None,
        audit_service: AuditService | None = None,
    ) -> None:
        self.db = db
        self.user_repo = user_repo
        self.admin_repo = admin_repo
        self.payment_repo = payment_repo
        self.audit_service = audit_service

    def _log_admin_action(
        self,
        *,
        actor_user_id,
        action: str,
        resource_type: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
        resource_id=None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        if not self.audit_service:
            return

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

    def list_users(self, skip: int = 0, limit: int = 50):
        return self.user_repo.list_users(skip=skip, limit=limit)

    def list_users_page(
        self,
        *,
        skip: int,
        limit: int,
        page: int,
        page_size: int,
        actor_user_id,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        users = self.user_repo.list_users(skip=skip, limit=limit)
        total = self.user_repo.count_users()

        if self.audit_service:
            try:
                self.audit_service.log_action(
                    actor_type=LogActorType.admin,
                    actor_user_id=actor_user_id,
                    action="admin_list_users",
                    resource_type="user",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "page": page,
                        "page_size": page_size,
                        "result_count": len(users),
                    },
                )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

        return users, total

    def list_bookings_page(
        self,
        *,
        skip: int,
        limit: int,
        page: int,
        page_size: int,
        actor_user_id,
        status: BookingStatus | None = None,
        payment_status: PaymentStatus | None = None,
        booking_code: str | None = None,
        sort_by: str = "booked_at",
        sort_order: str = "desc",
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        bookings = self.list_bookings(
            skip=skip,
            limit=limit,
            status=status,
            payment_status=payment_status,
            booking_code=booking_code,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        total = self.admin_repo.count_bookings(
            status=status,
            payment_status=payment_status,
            booking_code=booking_code,
        )

        if self.audit_service:
            try:
                self._log_admin_action(
                    actor_user_id=actor_user_id,
                    action="admin_list_bookings",
                    resource_type="booking",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "page": page,
                        "page_size": page_size,
                        "status": status,
                        "payment_status": payment_status,
                        "booking_code": booking_code,
                        "sort_by": sort_by,
                        "sort_order": sort_order,
                        "result_count": len(bookings),
                    },
                )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

        return bookings, total

    def list_bookings(
        self,
        skip: int = 0,
        limit: int = 50,
        status: BookingStatus | None = None,
        payment_status: PaymentStatus | None = None,
        booking_code: str | None = None,
        sort_by: str = "booked_at",
        sort_order: str = "desc",
    ):
        return self.admin_repo.list_bookings(
            skip=skip,
            limit=limit,
            status=status,
            payment_status=payment_status,
            booking_code=booking_code,
            sort_by=sort_by,
            sort_order=sort_order,
        )

    def list_cancelled_bookings(self, skip: int = 0, limit: int = 50):
        return self.admin_repo.list_cancelled_bookings(skip=skip, limit=limit)

    def list_cancelled_bookings_page(
        self,
        *,
        skip: int,
        limit: int,
        page: int,
        page_size: int,
        actor_user_id,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        bookings = self.list_cancelled_bookings(skip=skip, limit=limit)
        total = self.admin_repo.count_cancelled_bookings()

        if self.audit_service:
            try:
                self._log_admin_action(
                    actor_user_id=actor_user_id,
                    action="admin_list_cancelled_bookings",
                    resource_type="booking",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "page": page,
                        "page_size": page_size,
                        "result_count": len(bookings),
                    },
                )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

        return bookings, total

    def list_payments(self, skip: int = 0, limit: int = 50):
        return self.admin_repo.list_payments(skip=skip, limit=limit)

    def list_payments_page(
        self,
        *,
        skip: int,
        limit: int,
        page: int,
        page_size: int,
        actor_user_id,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        payments = self.list_payments(skip=skip, limit=limit)
        total = self.admin_repo.count_payments()

        if self.audit_service:
            try:
                self._log_admin_action(
                    actor_user_id=actor_user_id,
                    action="admin_list_payments",
                    resource_type="payment",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "page": page,
                        "page_size": page_size,
                        "result_count": len(payments),
                    },
                )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

        return payments, total

    def list_refunds(
        self,
        skip: int = 0,
        limit: int = 50,
        status: RefundStatus | None = None,
        payment_id: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ):
        return self.admin_repo.list_refunds(
            skip=skip,
            limit=limit,
            status=status,
            payment_id=payment_id,
            sort_by=sort_by,
            sort_order=sort_order,
        )

    def list_refunds_page(
        self,
        *,
        skip: int,
        limit: int,
        page: int,
        page_size: int,
        actor_user_id,
        status: RefundStatus | None = None,
        payment_id: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        refunds = self.list_refunds(
            skip=skip,
            limit=limit,
            status=status,
            payment_id=payment_id,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        total = self.admin_repo.count_refunds(status=status, payment_id=payment_id)

        if self.audit_service:
            try:
                self._log_admin_action(
                    actor_user_id=actor_user_id,
                    action="admin_list_refunds",
                    resource_type="refund",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "page": page,
                        "page_size": page_size,
                        "status": status,
                        "payment_id": payment_id,
                        "sort_by": sort_by,
                        "sort_order": sort_order,
                        "result_count": len(refunds),
                    },
                )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

        return refunds, total

    def list_audit_logs(self, skip: int = 0, limit: int = 50):
        return self.admin_repo.list_audit_logs(skip=skip, limit=limit)

    def list_audit_logs_page(
        self,
        *,
        skip: int,
        limit: int,
        page: int,
        page_size: int,
        actor_user_id,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        logs = self.list_audit_logs(skip=skip, limit=limit)
        total = self.admin_repo.count_audit_logs()

        if self.audit_service:
            try:
                self._log_admin_action(
                    actor_user_id=actor_user_id,
                    action="admin_list_audit_logs",
                    resource_type="audit_log",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "page": page,
                        "page_size": page_size,
                        "result_count": len(logs),
                    },
                )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

        return logs, total

    def _assert_refund_transition_allowed(self, current_status: str, new_status: str) -> None:
        allowed_transitions = {
            RefundStatus.pending.value: {
                RefundStatus.processed.value,
                RefundStatus.failed.value,
                RefundStatus.cancelled.value,
            },
            RefundStatus.failed.value: {
                RefundStatus.processed.value,
                RefundStatus.cancelled.value,
            },
            RefundStatus.processed.value: set(),
            RefundStatus.cancelled.value: set(),
        }

        if new_status == current_status:
            raise ConflictAppException(f"Refund is already in status: {current_status}")

        if new_status not in allowed_transitions.get(current_status, set()):
            raise ConflictAppException(
                f"Refund transition is not allowed from {current_status} to {new_status}"
            )

    def update_refund_status(
        self,
        *,
        refund_id: str,
        new_status: RefundStatus | str,
        reason: str | None = None,
    ):
        if not self.payment_repo:
            raise ValidationAppException("Payment repository is required")

        refund = self.payment_repo.get_refund_by_id(refund_id)
        if not refund:
            raise NotFoundAppException("Refund not found")

        try:
            target_status = (
                new_status if isinstance(new_status, RefundStatus) else RefundStatus(new_status)
            )
        except ValueError as exc:
            raise ValidationAppException("Invalid refund status") from exc

        current_status = enum_to_str(refund.status)
        self._assert_refund_transition_allowed(current_status, target_status.value)

        refund.status = target_status

        if refund.status == RefundStatus.processed:
            refund.processed_at = datetime.now(timezone.utc)

        if reason is not None:
            refund.reason = reason

        self.payment_repo.save_refund(refund)
        return refund

    def update_refund_status_with_audit(
        self,
        *,
        refund_id: str,
        new_status: RefundStatus | str,
        reason: str | None,
        actor_user_id,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        try:
            with self.db.begin_nested():
                target_status_value = (
                    new_status.value if isinstance(new_status, RefundStatus) else new_status
                )
                refund = self.update_refund_status(
                    refund_id=refund_id,
                    new_status=new_status,
                    reason=reason,
                )
                self._log_admin_action(
                    actor_user_id=actor_user_id,
                    action="admin_update_refund_status",
                    resource_type="refund",
                    resource_id=refund.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "new_status": target_status_value,
                        "reason": reason,
                    },
                )

            self.db.commit()
            self.db.refresh(refund)
            return refund
        except Exception:
            self.db.rollback()
            raise
