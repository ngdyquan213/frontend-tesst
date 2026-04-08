from __future__ import annotations

import logging
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictAppException, NotFoundAppException, ValidationAppException
from app.core.logging import build_log_extra
from app.models.enums import LogActorType, PaymentMethod, PaymentStatus
from app.models.payment import Payment
from app.repositories.booking_repository import BookingRepository
from app.repositories.payment_repository import PaymentRepository
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.services.payment_gateway_service import PaymentGatewayService
from app.utils.enums import enum_to_str
from app.utils.ip_utils import normalize_ip
from app.workers.email_worker import EmailWorker

PAYMENT_IDEMPOTENCY_CONSTRAINT = "uq_payments_booking_id_idempotency_key"
PAYMENT_GATEWAY_ORDER_REF_CONSTRAINT = "uq_payments_gateway_order_ref"
PAYMENT_REFERENCE_MAX_LENGTH = 255
logger = logging.getLogger("app.payment")


class PaymentService(ApplicationService):
    def __init__(
        self,
        db: Session,
        booking_repo: BookingRepository,
        payment_repo: PaymentRepository,
        audit_service: AuditService,
        email_worker: EmailWorker,
        gateway_service: PaymentGatewayService | None = None,
    ) -> None:
        self.db = db
        self.booking_repo = booking_repo
        self.payment_repo = payment_repo
        self.audit_service = audit_service
        self.email_worker = email_worker
        self.gateway_service = gateway_service or PaymentGatewayService()

    @staticmethod
    def _assert_idempotent_request_matches_existing(
        *,
        existing: Payment,
        payment_method: PaymentMethod,
        amount: Decimal,
        currency: str,
    ) -> None:
        if existing.payment_method != payment_method:
            raise ConflictAppException(
                "Idempotency key was already used with a different payment method"
            )

        if Decimal(existing.amount) != amount or existing.currency != currency:
            raise ConflictAppException(
                "Idempotency key was already used with different payment parameters"
            )

    def initiate_payment(
        self,
        *,
        booking_id: str,
        user_id: str,
        payment_method: PaymentMethod,
        idempotency_key: str | None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Payment:
        booking = self.booking_repo.get_by_id_and_user_id(booking_id, user_id)
        if not booking:
            raise ValidationAppException("Booking not found")

        if not idempotency_key:
            raise ValidationAppException("Idempotency key is required")

        self.gateway_service.assert_gateway_is_configured(payment_method=payment_method)

        existing = self.payment_repo.get_by_booking_and_idempotency_key(
            booking_id=booking_id,
            idempotency_key=idempotency_key,
        )
        amount = Decimal(booking.total_final_amount)
        if amount <= Decimal("0.00"):
            raise ValidationAppException("Invalid payment amount")

        if existing:
            self._assert_idempotent_request_matches_existing(
                existing=existing,
                payment_method=payment_method,
                amount=amount,
                currency=booking.currency,
            )
            logger.info(
                "payment_initiation_reused",
                extra=build_log_extra(
                    "payment_initiation_reused",
                    booking_id=str(booking.id),
                    payment_id=str(existing.id),
                    idempotency_key=idempotency_key,
                    gateway_order_ref=existing.gateway_order_ref,
                ),
            )
            gateway_payload = self.gateway_service.build_existing_gateway_payload(payment=existing)
            if gateway_payload is not None:
                existing.gateway_payload = gateway_payload
            return existing

        booking_payment_status = enum_to_str(booking.payment_status)
        if booking_payment_status == PaymentStatus.paid.value:
            raise ConflictAppException("Booking is already paid")

        gateway_order_ref = f"PAY-{booking.booking_code}-{idempotency_key}"
        if len(gateway_order_ref) > PAYMENT_REFERENCE_MAX_LENGTH:
            raise ValidationAppException("Idempotency key is too long")

        normalized_ip = normalize_ip(ip_address)
        gateway_result = None

        try:
            payment = Payment(
                booking_id=booking.id,
                initiated_by=booking.user_id,
                payment_method=payment_method,
                status=PaymentStatus.pending,
                amount=amount,
                currency=booking.currency,
                gateway_order_ref=gateway_order_ref,
                gateway_transaction_ref=None,
                idempotency_key=idempotency_key,
                paid_at=None,
            )
            self.payment_repo.add_payment(payment)
            gateway_result = self.gateway_service.create_payment_session(payment=payment)
            if gateway_result is not None:
                payment.gateway_transaction_ref = gateway_result.external_reference

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=booking.user_id,
                action="payment_initiated",
                resource_type="payment",
                resource_id=payment.id,
                ip_address=normalized_ip,
                user_agent=user_agent,
                metadata={
                    "booking_id": str(booking.id),
                    "booking_code": booking.booking_code,
                    "amount": str(payment.amount),
                    "currency": payment.currency,
                    "payment_method": payment_method.value,
                    "gateway_order_ref": gateway_order_ref,
                },
            )
            self.commit()
            logger.info(
                "payment_initiated",
                extra=build_log_extra(
                    "payment_initiated",
                    booking_id=str(booking.id),
                    booking_code=booking.booking_code,
                    payment_id=str(payment.id),
                    payment_method=payment_method.value,
                    amount=str(payment.amount),
                    currency=payment.currency,
                    gateway_order_ref=gateway_order_ref,
                    idempotency_key=idempotency_key,
                ),
            )
        except IntegrityError as exc:
            self.db.rollback()

            if PAYMENT_IDEMPOTENCY_CONSTRAINT not in str(
                exc.orig
            ) and PAYMENT_GATEWAY_ORDER_REF_CONSTRAINT not in str(exc.orig):
                raise

            existing = self.payment_repo.get_by_booking_and_idempotency_key(
                booking_id=booking_id,
                idempotency_key=idempotency_key,
            )
            if existing is None:
                raise

            payment = existing
            self._assert_idempotent_request_matches_existing(
                existing=payment,
                payment_method=payment_method,
                amount=amount,
                currency=booking.currency,
            )
            gateway_payload = self.gateway_service.build_existing_gateway_payload(payment=payment)
            if gateway_payload is not None:
                payment.gateway_payload = gateway_payload
            logger.warning(
                "payment_initiation_race_reused_existing",
                extra=build_log_extra(
                    "payment_initiation_race_reused_existing",
                    booking_id=str(booking.id),
                    payment_id=str(payment.id),
                    idempotency_key=idempotency_key,
                ),
            )
        except Exception:
            self.db.rollback()
            raise

        self.db.refresh(payment)
        if gateway_result is not None:
            payment.gateway_payload = gateway_result.gateway_payload
        return payment

    def simulate_success(
        self,
        *,
        payment_id: str,
        user_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Payment:
        payment = self.payment_repo.get_by_id(payment_id)
        if not payment:
            raise NotFoundAppException("Payment not found")

        booking = self.booking_repo.get_by_id_and_user_id(str(payment.booking_id), user_id)
        if not booking:
            raise ValidationAppException("Booking not found")

        current_status = enum_to_str(payment.status)
        if current_status != PaymentStatus.pending.value:
            raise ConflictAppException("Only pending payments can be simulated as successful")

        payment.status = PaymentStatus.paid
        payment.gateway_transaction_ref = (
            payment.gateway_transaction_ref or f"SIM-{uuid4().hex[:12].upper()}"
        )
        payment.paid_at = datetime.now(timezone.utc)
        booking.payment_status = PaymentStatus.paid

        normalized_ip = normalize_ip(ip_address)

        self.payment_repo.save(payment)
        self.booking_repo.save(booking)
        self.audit_service.log_action(
            actor_type=LogActorType.user,
            actor_user_id=booking.user_id,
            action="payment_simulated_success",
            resource_type="payment",
            resource_id=payment.id,
            ip_address=normalized_ip,
            user_agent=user_agent,
            metadata={"booking_id": str(booking.id)},
        )
        self.commit_and_refresh(payment)
        return payment

    def get_booking_payment_status(self, *, booking_id: str, user_id: str):
        booking = self.booking_repo.get_by_id_and_user_id(booking_id, user_id)
        if not booking:
            return None, None

        payment = self.payment_repo.get_latest_by_booking_id(booking_id)
        return booking, payment
