from __future__ import annotations

from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.booking import Booking
from app.models.enums import PaymentStatus, RefundStatus
from app.models.payment import Payment
from app.models.refund import Refund
from app.utils.enums import enum_to_str


class AdminDashboardRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_booking_status_counts(self) -> list[dict]:
        rows = (
            self.db.query(
                Booking.status.label("status"),
                func.count(Booking.id).label("count"),
            )
            .group_by(Booking.status)
            .all()
        )
        return [
            {
                "status": enum_to_str(row.status),
                "count": int(row.count),
            }
            for row in rows
        ]

    def get_payment_status_counts(self) -> list[dict]:
        rows = (
            self.db.query(
                Payment.status.label("status"),
                func.count(Payment.id).label("count"),
            )
            .group_by(Payment.status)
            .all()
        )
        return [
            {
                "status": enum_to_str(row.status),
                "count": int(row.count),
            }
            for row in rows
        ]

    def get_refund_status_counts(self) -> list[dict]:
        rows = (
            self.db.query(
                Refund.status.label("status"),
                func.count(Refund.id).label("count"),
            )
            .group_by(Refund.status)
            .all()
        )
        return [
            {
                "status": enum_to_str(row.status),
                "count": int(row.count),
            }
            for row in rows
        ]

    def get_revenue_summary(self) -> dict:
        paid_total = (
            self.db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(Payment.status == PaymentStatus.paid)
            .scalar()
        )
        if paid_total is None:
            paid_total = Decimal("0.00")

        refunded_total = (
            self.db.query(func.coalesce(func.sum(Refund.amount), 0))
            .filter(Refund.status == RefundStatus.processed)
            .scalar()
        )
        if refunded_total is None:
            refunded_total = Decimal("0.00")

        total_paid_amount = Decimal(str(paid_total))
        total_refunded_amount = Decimal(str(refunded_total))
        net_revenue_amount = total_paid_amount - total_refunded_amount

        return {
            "total_paid_amount": total_paid_amount,
            "total_refunded_amount": total_refunded_amount,
            "net_revenue_amount": net_revenue_amount,
            "currency": "VND",
        }

    def get_recent_activities(self, limit: int = 10) -> list[AuditLog]:
        return self.db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
