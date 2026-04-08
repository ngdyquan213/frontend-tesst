from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from app.core.constants import ALLOWED_PAYMENT_CALLBACK_STATUSES
from app.core.exceptions import ConflictAppException, ValidationAppException
from app.models.enums import PaymentStatus
from app.utils.enums import enum_to_str


class PaymentCallbackDomainService:
    def normalize_callback_status(self, status: str) -> str:
        normalized_status = status.lower()
        if normalized_status not in ALLOWED_PAYMENT_CALLBACK_STATUSES:
            raise ValidationAppException("Unsupported payment callback status")
        return normalized_status

    def validate_callback_against_payment(
        self,
        *,
        payment,
        amount: str,
        currency: str,
        status: str,
    ) -> str:
        normalized_status = self.normalize_callback_status(status)

        expected_amount = Decimal(payment.amount)
        actual_amount = Decimal(amount)
        if actual_amount != expected_amount:
            raise ValidationAppException("Payment amount mismatch")

        expected_currency = payment.currency.upper()
        actual_currency = currency.upper()
        if actual_currency != expected_currency:
            raise ValidationAppException("Payment currency mismatch")

        current_status = enum_to_str(payment.status)
        self._assert_transition_allowed(current_status, normalized_status)
        return normalized_status

    def apply_callback(
        self,
        *,
        payment,
        booking,
        gateway_transaction_ref: str,
        normalized_status: str,
        processed_at: datetime,
    ) -> None:
        payment.gateway_transaction_ref = gateway_transaction_ref

        if normalized_status == PaymentStatus.paid.value:
            payment.status = PaymentStatus.paid
            payment.paid_at = processed_at
            booking.payment_status = PaymentStatus.paid
            return

        if normalized_status == PaymentStatus.failed.value:
            payment.status = PaymentStatus.failed
            booking.payment_status = PaymentStatus.failed
            return

        if normalized_status == PaymentStatus.cancelled.value:
            payment.status = PaymentStatus.cancelled
            booking.payment_status = PaymentStatus.cancelled

    def _assert_transition_allowed(self, current_status: str, incoming_status: str) -> None:
        terminal_statuses = {
            PaymentStatus.paid.value,
            PaymentStatus.failed.value,
            PaymentStatus.cancelled.value,
            PaymentStatus.refunded.value,
        }

        if current_status == PaymentStatus.refunded.value:
            raise ConflictAppException("Payment is already refunded")

        if (
            current_status == PaymentStatus.paid.value
            and incoming_status == PaymentStatus.paid.value
        ):
            raise ConflictAppException("Payment is already marked as paid")

        if current_status in terminal_statuses and current_status != incoming_status:
            raise ConflictAppException(
                f"Payment transition is not allowed from {current_status} to {incoming_status}"
            )
