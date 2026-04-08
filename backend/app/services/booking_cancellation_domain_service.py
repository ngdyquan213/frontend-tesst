from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from app.core.exceptions import ConflictAppException
from app.models.enums import BookingStatus, PaymentStatus, RefundStatus
from app.models.refund import Refund
from app.utils.enums import enum_to_str


@dataclass(slots=True)
class BookingCancellationResult:
    refund: Refund | None
    refund_amount: Decimal
    payment_updated: bool


class BookingCancellationDomainService:
    def assert_booking_can_be_cancelled(self, booking) -> None:
        current_status = enum_to_str(booking.status)
        if current_status == BookingStatus.cancelled.value:
            raise ConflictAppException("Booking already cancelled")

    def apply_cancellation(
        self,
        *,
        booking,
        payment,
        reason: str | None,
        cancelled_at: datetime,
    ) -> BookingCancellationResult:
        booking.status = BookingStatus.cancelled
        booking.cancelled_at = cancelled_at
        booking.cancellation_reason = reason

        if not payment:
            return BookingCancellationResult(
                refund=None,
                refund_amount=Decimal("0.00"),
                payment_updated=False,
            )

        payment_status = enum_to_str(payment.status)

        if payment_status == PaymentStatus.paid.value:
            refund_amount = Decimal(booking.total_final_amount)
            refund = Refund(
                payment_id=payment.id,
                amount=refund_amount,
                currency=payment.currency,
                status=RefundStatus.processed,
                reason=reason or "User cancelled booking",
                processed_at=cancelled_at,
            )
            payment.status = PaymentStatus.refunded
            booking.payment_status = PaymentStatus.refunded
            return BookingCancellationResult(
                refund=refund,
                refund_amount=refund_amount,
                payment_updated=True,
            )

        if payment_status in {PaymentStatus.pending.value, PaymentStatus.authorized.value}:
            payment.status = PaymentStatus.cancelled
            booking.payment_status = PaymentStatus.cancelled
            return BookingCancellationResult(
                refund=None,
                refund_amount=Decimal("0.00"),
                payment_updated=True,
            )

        return BookingCancellationResult(
            refund=None,
            refund_amount=Decimal("0.00"),
            payment_updated=False,
        )
