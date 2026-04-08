from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentStatus, RefundStatus
from app.models.payment import Payment
from app.models.refund import Refund


class AdminRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_bookings(
        self,
        skip: int = 0,
        limit: int = 50,
        status: BookingStatus | None = None,
        payment_status: PaymentStatus | None = None,
        booking_code: str | None = None,
        sort_by: str = "booked_at",
        sort_order: str = "desc",
    ) -> list[Booking]:
        query = self.db.query(Booking)

        if status:
            query = query.filter(Booking.status == status)

        if payment_status:
            query = query.filter(Booking.payment_status == payment_status)

        if booking_code:
            query = query.filter(Booking.booking_code.ilike(f"%{booking_code}%"))

        sort_column = {
            "booked_at": Booking.booked_at,
            "total_final_amount": Booking.total_final_amount,
            "booking_code": Booking.booking_code,
        }.get(sort_by, Booking.booked_at)

        order_clause = desc(sort_column) if sort_order == "desc" else asc(sort_column)

        return query.order_by(order_clause).offset(skip).limit(limit).all()

    def count_bookings(
        self,
        status: BookingStatus | None = None,
        payment_status: PaymentStatus | None = None,
        booking_code: str | None = None,
    ) -> int:
        query = self.db.query(Booking)

        if status:
            query = query.filter(Booking.status == status)

        if payment_status:
            query = query.filter(Booking.payment_status == payment_status)

        if booking_code:
            query = query.filter(Booking.booking_code.ilike(f"%{booking_code}%"))

        return query.count()

    def list_cancelled_bookings(self, skip: int = 0, limit: int = 50) -> list[Booking]:
        return (
            self.db.query(Booking)
            .filter(Booking.status == BookingStatus.cancelled)
            .order_by(Booking.cancelled_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_cancelled_bookings(self) -> int:
        return self.db.query(Booking).filter(Booking.status == BookingStatus.cancelled).count()

    def list_payments(self, skip: int = 0, limit: int = 50) -> list[Payment]:
        return (
            self.db.query(Payment)
            .order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_payments(self) -> int:
        return self.db.query(Payment).count()

    def list_refunds(
        self,
        skip: int = 0,
        limit: int = 50,
        status: RefundStatus | None = None,
        payment_id: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> list[Refund]:
        query = self.db.query(Refund)

        if status:
            query = query.filter(Refund.status == status)

        if payment_id:
            query = query.filter(Refund.payment_id == payment_id)

        sort_column = {
            "created_at": Refund.created_at,
            "processed_at": Refund.processed_at,
            "amount": Refund.amount,
        }.get(sort_by, Refund.created_at)

        order_clause = desc(sort_column) if sort_order == "desc" else asc(sort_column)

        return query.order_by(order_clause).offset(skip).limit(limit).all()

    def count_refunds(
        self,
        status: RefundStatus | None = None,
        payment_id: str | None = None,
    ) -> int:
        query = self.db.query(Refund)

        if status:
            query = query.filter(Refund.status == status)

        if payment_id:
            query = query.filter(Refund.payment_id == payment_id)

        return query.count()

    def list_audit_logs(self, skip: int = 0, limit: int = 50) -> list[AuditLog]:
        return (
            self.db.query(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_audit_logs(self) -> int:
        return self.db.query(AuditLog).count()
