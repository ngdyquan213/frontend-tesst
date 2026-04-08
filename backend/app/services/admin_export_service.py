from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.enums import BookingStatus, LogActorType, PaymentStatus, RefundStatus
from app.repositories.admin_repository import AdminRepository
from app.services.audit_service import AuditService
from app.utils.csv_utils import build_csv_bytes
from app.utils.enums import enum_to_str


class AdminExportService:
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
        bookings = self._collect_in_batches(
            lambda skip, limit: self.admin_repo.list_bookings(
                skip=skip,
                limit=limit,
                status=status,
                payment_status=payment_status,
                booking_code=booking_code,
                sort_by=sort_by,
                sort_order=sort_order,
            )
        )

        headers = [
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
        rows = [
            [
                str(b.id),
                b.booking_code,
                str(b.user_id),
                enum_to_str(b.status),
                str(b.total_final_amount),
                b.currency,
                enum_to_str(b.payment_status),
                b.booked_at.isoformat() if b.booked_at else "",
                b.cancelled_at.isoformat() if getattr(b, "cancelled_at", None) else "",
            ]
            for b in bookings
        ]
        csv_bytes = build_csv_bytes(headers, rows)
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
        return csv_bytes

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
        refunds = self._collect_in_batches(
            lambda skip, limit: self.admin_repo.list_refunds(
                skip=skip,
                limit=limit,
                status=status,
                payment_id=payment_id,
                sort_by=sort_by,
                sort_order=sort_order,
            )
        )

        headers = [
            "id",
            "payment_id",
            "amount",
            "currency",
            "status",
            "reason",
            "processed_at",
            "created_at",
        ]
        rows = [
            [
                str(r.id),
                str(r.payment_id),
                str(r.amount),
                r.currency,
                enum_to_str(r.status),
                r.reason or "",
                r.processed_at.isoformat() if r.processed_at else "",
                r.created_at.isoformat() if r.created_at else "",
            ]
            for r in refunds
        ]
        csv_bytes = build_csv_bytes(headers, rows)
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
        return csv_bytes

    def export_audit_logs_csv(
        self,
        *,
        actor_user_id=None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> bytes:
        logs = self._collect_in_batches(self.admin_repo.list_audit_logs)

        headers = [
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
        rows = [
            [
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
            for log in logs
        ]
        csv_bytes = build_csv_bytes(headers, rows)
        self._audit_export(
            actor_user_id=actor_user_id,
            action="admin_export_audit_logs_csv",
            resource_type="audit_log",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={},
        )
        return csv_bytes

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
 
