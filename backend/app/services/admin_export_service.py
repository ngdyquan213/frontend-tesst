from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy.orm import Session

from app.models.enums import BookingStatus, LogActorType, PaymentStatus, RefundStatus
from app.repositories.admin_repository import AdminRepository
from app.services.audit_service import AuditService
from app.utils.csv_utils import iter_csv_bytes
from app.utils.enums import enum_to_str


class AdminExportService:
    EXPORT_BATCH_SIZE = 1000

    def __init__(
        self,
        admin_repo: AdminRepository,
        db: Session | None = None,
        audit_service: AuditService | None = None,
    ) -> None:
        self.admin_repo = admin_repo
        self.db = db
        self.audit_service = audit_service

    @staticmethod
    def _collect_in_batches(fetch_page, *, batch_size: int = 1000):
        items = []
        skip = 0

        while True:
            batch = fetch_page(skip, batch_size)
            if not batch:
                break

            items.extend(batch)
            if len(batch) < batch_size:
                break

            skip += batch_size

        return items

    @staticmethod
    def _iter_batches(fetch_page, *, batch_size: int = 1000):
        skip = 0

        while True:
            batch = fetch_page(skip, batch_size)
            if not batch:
                break

            yield batch
            if len(batch) < batch_size:
                break

            skip += batch_size

    @staticmethod
    def _booking_headers() -> list[str]:
        return [
            "id",
            "booking_code",
            "user_id",
            "status",
            "total_final_amount",
            "currency",
            "payment_status",
            "booked_at",
            "cancelled_at",
        ]

    @staticmethod
    def _refund_headers() -> list[str]:
        return [
            "id",
            "payment_id",
            "amount",
            "currency",
            "status",
            "reason",
            "processed_at",
            "created_at",
        ]

    @staticmethod
    def _audit_log_headers() -> list[str]:
        return [
            "id",
            "actor_type",
            "actor_user_id",
            "action",
            "resource_type",
            "resource_id",
            "ip_address",
            "user_agent",
            "created_at",
        ]

    @staticmethod
    def _booking_to_row(booking) -> list[object]:
        return [
            str(booking.id),
            booking.booking_code,
            str(booking.user_id),
            enum_to_str(booking.status),
            str(booking.total_final_amount),
            booking.currency,
            enum_to_str(booking.payment_status),
            booking.booked_at.isoformat() if booking.booked_at else "",
            booking.cancelled_at.isoformat() if getattr(booking, "cancelled_at", None) else "",
        ]

    @staticmethod
    def _refund_to_row(refund) -> list[object]:
        return [
            str(refund.id),
            str(refund.payment_id),
            str(refund.amount),
            refund.currency,
            enum_to_str(refund.status),
            refund.reason or "",
            refund.processed_at.isoformat() if refund.processed_at else "",
            refund.created_at.isoformat() if refund.created_at else "",
        ]

    @staticmethod
    def _audit_log_to_row(log) -> list[object]:
        return [
            str(log.id),
            enum_to_str(log.actor_type),
            str(log.actor_user_id) if log.actor_user_id else "",
            log.action,
            log.resource_type or "",
            str(log.resource_id) if log.resource_id else "",
            log.ip_address or "",
            log.user_agent or "",
            log.created_at.isoformat() if log.created_at else "",
        ]

    def stream_bookings_csv(
        self,
        *,
        status: BookingStatus | None = None,
        payment_status: PaymentStatus | None = None,
        booking_code: str | None = None,
        sort_by: str = "booked_at",
        sort_order: str = "desc",
        actor_user_id=None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Iterator[bytes]:
        self._audit_export(
            actor_user_id=actor_user_id,
            action="admin_export_bookings_csv",
            resource_type="booking",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "status": status,
                "payment_status": payment_status,
                "booking_code": booking_code,
                "sort_by": sort_by,
                "sort_order": sort_order,
            },
        )
        return iter_csv_bytes(
            headers=self._booking_headers(),
            row_batches=(
                [self._booking_to_row(booking) for booking in batch]
                for batch in self._iter_batches(
                    lambda skip, limit: self.admin_repo.list_bookings(
                        skip=skip,
                        limit=limit,
                        status=status,
                        payment_status=payment_status,
                        booking_code=booking_code,
                        sort_by=sort_by,
                        sort_order=sort_order,
                    ),
                    batch_size=self.EXPORT_BATCH_SIZE,
                )
            ),
        )

    def stream_refunds_csv(
        self,
        *,
        status: RefundStatus | None = None,
        payment_id: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        actor_user_id=None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Iterator[bytes]:
        self._audit_export(
            actor_user_id=actor_user_id,
            action="admin_export_refunds_csv",
            resource_type="refund",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "status": status,
                "payment_id": payment_id,
                "sort_by": sort_by,
                "sort_order": sort_order,
            },
        )
        return iter_csv_bytes(
            headers=self._refund_headers(),
            row_batches=(
                [self._refund_to_row(refund) for refund in batch]
                for batch in self._iter_batches(
                    lambda skip, limit: self.admin_repo.list_refunds(
                        skip=skip,
                        limit=limit,
                        status=status,
                        payment_id=payment_id,
                        sort_by=sort_by,
                        sort_order=sort_order,
                    ),
                    batch_size=self.EXPORT_BATCH_SIZE,
                )
            ),
        )

    def stream_audit_logs_csv(
        self,
        *,
        actor_user_id=None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Iterator[bytes]:
        self._audit_export(
            actor_user_id=actor_user_id,
            action="admin_export_audit_logs_csv",
            resource_type="audit_log",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={},
        )
        return iter_csv_bytes(
            headers=self._audit_log_headers(),
            row_batches=(
                [self._audit_log_to_row(log) for log in batch]
                for batch in self._iter_batches(
                    self.admin_repo.list_audit_logs,
                    batch_size=self.EXPORT_BATCH_SIZE,
                )
            ),
        )

    def export_bookings_csv(
        self,
        *,
        status: BookingStatus | None = None,
        payment_status: PaymentStatus | None = None,
        booking_code: str | None = None,
        sort_by: str = "booked_at",
        sort_order: str = "desc",
        actor_user_id=None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> bytes:
        return b"".join(
            self.stream_bookings_csv(
                status=status,
                payment_status=payment_status,
                booking_code=booking_code,
                sort_by=sort_by,
                sort_order=sort_order,
                actor_user_id=actor_user_id,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        )

    def export_refunds_csv(
        self,
        *,
        status: RefundStatus | None = None,
        payment_id: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        actor_user_id=None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> bytes:
        return b"".join(
            self.stream_refunds_csv(
                status=status,
                payment_id=payment_id,
                sort_by=sort_by,
                sort_order=sort_order,
                actor_user_id=actor_user_id,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        )

    def export_audit_logs_csv(
        self,
        *,
        actor_user_id=None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> bytes:
        return b"".join(
            self.stream_audit_logs_csv(
                actor_user_id=actor_user_id,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        )

    def _audit_export(
        self,
        *,
        actor_user_id,
        action: str,
        resource_type: str,
        ip_address: str | None,
        user_agent: str | None,
        metadata: dict | None,
    ) -> None:
        if actor_user_id is None or self.db is None or self.audit_service is None:
            return

        try:
            self.audit_service.log_action(
                actor_type=LogActorType.admin,
                actor_user_id=actor_user_id,
                action=action,
                resource_type=resource_type,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata=metadata,
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
 
