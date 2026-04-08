from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    ExternalServiceAppException,
    NotFoundAppException,
    ValidationAppException,
)
from app.core.logging import build_log_extra
from app.core.metrics import operational_metrics
from app.core.security import verify_payment_callback_signature
from app.models.enums import LogActorType, PaymentStatus, SecurityEventType
from app.models.payment import PaymentCallback
from app.repositories.booking_repository import BookingRepository
from app.repositories.payment_repository import PaymentRepository
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.services.outbox_service import OutboxService
from app.services.payment_callback_domain_service import PaymentCallbackDomainService
from app.services.payment_gateway_service import PaymentGatewayService
from app.utils.ip_utils import ip_in_allowlist, normalize_ip
from app.workers.email_worker import EmailWorker

PAYMENT_CALLBACK_REPLAY_CONSTRAINT = "uq_payment_callbacks_gateway_name_transaction_ref"
logger = logging.getLogger("app.payment")


class PaymentCallbackService(ApplicationService):
    def __init__(
        self,
        db: Session,
        booking_repo: BookingRepository,
        payment_repo: PaymentRepository,
        audit_service: AuditService,
        email_worker: EmailWorker,
        domain_service: PaymentCallbackDomainService,
        outbox_service: OutboxService | None = None,
        gateway_service: PaymentGatewayService | None = None,
    ) -> None:
        self.db = db
        self.booking_repo = booking_repo
        self.payment_repo = payment_repo
        self.audit_service = audit_service
        self.email_worker = email_worker
        self.domain_service = domain_service
        self.outbox_service = outbox_service or OutboxService(
            db=db,
            email_worker=email_worker,
        )
        self.gateway_service = gateway_service or PaymentGatewayService()

    def _reject_callback(
        self,
        *,
        message: str,
        reason: str,
        severity: str,
        title: str,
        description: str,
        ip_address: str | None,
        event_data: dict,
    ) -> None:
        operational_metrics.record_payment_callback_failure(reason=reason)
        logger.warning(
            "payment_callback_rejected",
            extra=build_log_extra(
                "payment_callback_rejected",
                reason=reason,
                severity=severity,
                source_ip=ip_address,
                **event_data,
            ),
        )
        self.audit_service.log_security_event(
            event_type=SecurityEventType.payment,
            severity=severity,
            title=title,
            description=description,
            ip_address=ip_address,
            event_data=event_data,
        )
        self.commit()
        raise ValidationAppException(message)

    def process_callback(
        self,
        *,
        gateway_name: str,
        gateway_order_ref: str,
        gateway_transaction_ref: str,
        amount: str,
        currency: str,
        status: str,
        signature: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
        signature_verified: bool = False,
    ):
        normalized_ip = normalize_ip(ip_address)
        logger.info(
            "payment_callback_received",
            extra=build_log_extra(
                "payment_callback_received",
                gateway_name=gateway_name,
                gateway_order_ref=gateway_order_ref,
                gateway_transaction_ref=gateway_transaction_ref,
                source_ip=normalized_ip,
                status=status,
            ),
        )

        if settings.payment_callback_source_allowlist_list and not ip_in_allowlist(
            normalized_ip,
            settings.payment_callback_source_allowlist_list,
        ):
            self._reject_callback(
                message="Callback source is not allowed",
                reason="source_not_allowed",
                severity="high",
                title="Payment callback source is not allowed",
                description="Payment callback request originated from a non-allowlisted source",
                ip_address=normalized_ip,
                event_data={
                    "gateway_name": gateway_name,
                    "gateway_order_ref": gateway_order_ref,
                    "gateway_transaction_ref": gateway_transaction_ref,
                    "configured_allowlist": settings.payment_callback_source_allowlist_list,
                },
            )

        signature_ok = signature_verified or verify_payment_callback_signature(
            gateway_name=gateway_name,
            gateway_order_ref=gateway_order_ref,
            gateway_transaction_ref=gateway_transaction_ref,
            amount=amount,
            currency=currency,
            status=status,
            signature=signature,
        )
        if not signature_ok:
            self._reject_callback(
                message="Invalid callback signature",
                reason="invalid_signature",
                severity="critical",
                title="Invalid payment callback signature",
                description="Payment callback signature verification failed",
                ip_address=normalized_ip,
                event_data={
                    "gateway_name": gateway_name,
                    "gateway_order_ref": gateway_order_ref,
                    "gateway_transaction_ref": gateway_transaction_ref,
                },
            )

        existing_callback = self.payment_repo.get_callback_by_gateway_txn_ref(
            gateway_name=gateway_name,
            gateway_transaction_ref=gateway_transaction_ref,
        )
        if existing_callback:
            self._reject_callback(
                message="Replay callback detected",
                reason="replay_detected",
                severity="medium",
                title="Replay payment callback detected",
                description="Duplicate payment callback transaction reference detected",
                ip_address=normalized_ip,
                event_data={
                    "gateway_name": gateway_name,
                    "gateway_order_ref": gateway_order_ref,
                    "gateway_transaction_ref": gateway_transaction_ref,
                },
            )

        payment_hint = self.payment_repo.get_by_gateway_order_ref(gateway_order_ref)
        if not payment_hint:
            raise NotFoundAppException("Payment not found")

        booking = self.booking_repo.get_by_id_for_update(str(payment_hint.booking_id))
        if not booking:
            raise NotFoundAppException("Booking not found")

        payment = self.payment_repo.get_by_id_for_update(str(payment_hint.id))
        if not payment:
            raise NotFoundAppException("Payment not found")

        try:
            normalized_status = self.domain_service.validate_callback_against_payment(
                payment=payment,
                amount=amount,
                currency=currency,
                status=status,
            )
        except ValidationAppException as exc:
            if str(exc) == "Payment amount mismatch":
                self._reject_callback(
                    message=str(exc),
                    reason="amount_mismatch",
                    severity="critical",
                    title="Payment callback amount mismatch",
                    description="Payment callback amount does not match expected amount",
                    ip_address=normalized_ip,
                    event_data={
                        "gateway_order_ref": gateway_order_ref,
                        "expected_amount": str(payment.amount),
                        "actual_amount": amount,
                    },
                )

            if str(exc) == "Payment currency mismatch":
                self._reject_callback(
                    message=str(exc),
                    reason="currency_mismatch",
                    severity="critical",
                    title="Payment callback currency mismatch",
                    description="Payment callback currency does not match expected currency",
                    ip_address=normalized_ip,
                    event_data={
                        "gateway_order_ref": gateway_order_ref,
                        "expected_currency": payment.currency.upper(),
                        "actual_currency": currency.upper(),
                    },
                )

            raise

        try:
            with self.db.begin_nested():
                received_at = datetime.now(timezone.utc)
                callback = PaymentCallback(
                    payment_id=payment.id,
                    gateway_name=gateway_name,
                    gateway_transaction_ref=gateway_transaction_ref,
                    callback_payload={
                        "gateway_name": gateway_name,
                        "gateway_order_ref": gateway_order_ref,
                        "gateway_transaction_ref": gateway_transaction_ref,
                        "amount": amount,
                        "currency": currency,
                        "status": status,
                    },
                    signature_valid=True,
                    processed=True,
                    source_ip=normalized_ip,
                    received_at=received_at,
                )
                self.payment_repo.add_callback(callback)

                self.domain_service.apply_callback(
                    payment=payment,
                    booking=booking,
                    gateway_transaction_ref=gateway_transaction_ref,
                    normalized_status=normalized_status,
                    processed_at=received_at,
                )

                self.payment_repo.save(payment)
                self.booking_repo.save(booking)

                self.audit_service.log_action(
                    actor_type=LogActorType.system,
                    action="payment_callback_processed",
                    resource_type="payment",
                    resource_id=payment.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "gateway_name": gateway_name,
                        "gateway_order_ref": gateway_order_ref,
                        "gateway_transaction_ref": gateway_transaction_ref,
                        "status": normalized_status,
                    },
                )

                if normalized_status == PaymentStatus.paid.value and booking.user:
                    self.outbox_service.enqueue_email(
                        handler="send_payment_success_email",
                        kwargs={
                            "to_email": booking.user.email,
                            "full_name": booking.user.full_name,
                            "booking_code": booking.booking_code,
                            "gateway_transaction_ref": payment.gateway_transaction_ref,
                        },
                    )
            self.commit()
            logger.info(
                "payment_callback_processed",
                extra=build_log_extra(
                    "payment_callback_processed",
                    payment_id=str(payment.id),
                    booking_id=str(booking.id),
                    gateway_name=gateway_name,
                    gateway_order_ref=gateway_order_ref,
                    gateway_transaction_ref=gateway_transaction_ref,
                    normalized_status=normalized_status,
                    source_ip=normalized_ip,
                ),
            )
        except IntegrityError as exc:
            self.db.rollback()

            if PAYMENT_CALLBACK_REPLAY_CONSTRAINT not in str(exc.orig):
                raise

            self._reject_callback(
                message="Replay callback detected",
                reason="replay_detected",
                severity="medium",
                title="Replay payment callback detected",
                description="Duplicate payment callback transaction reference detected",
                ip_address=normalized_ip,
                event_data={
                    "gateway_name": gateway_name,
                    "gateway_order_ref": gateway_order_ref,
                    "gateway_transaction_ref": gateway_transaction_ref,
                },
            )
        except Exception:
            self.db.rollback()
            operational_metrics.record_payment_callback_failure(reason="processing_error")
            logger.exception(
                "payment_callback_processing_failed",
                extra=build_log_extra(
                    "payment_callback_processing_failed",
                    gateway_name=gateway_name,
                    gateway_order_ref=gateway_order_ref,
                    gateway_transaction_ref=gateway_transaction_ref,
                    source_ip=normalized_ip,
                ),
            )
            raise

        self.refresh_all(payment, booking)
        return payment, booking

    def process_stripe_webhook(
        self,
        *,
        raw_body: bytes,
        signature_header: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        normalized_ip = normalize_ip(ip_address)

        try:
            callback_payload = self.gateway_service.parse_stripe_webhook(
                raw_body=raw_body,
                signature_header=signature_header,
            )
        except ExternalServiceAppException:
            raise
        except ValidationAppException as exc:
            error_message = str(exc)
            reason = {
                "Invalid callback signature": "invalid_signature",
                "Expired callback timestamp": "expired_timestamp",
                "Unsupported payment callback event": "unsupported_event",
            }.get(error_message, "invalid_payload")
            self._reject_callback(
                message=error_message,
                reason=reason,
                severity=(
                    "high"
                    if reason in {"invalid_signature", "expired_timestamp"}
                    else "medium"
                ),
                title="Stripe payment callback rejected",
                description=error_message,
                ip_address=normalized_ip,
                event_data={"gateway_name": "stripe"},
            )

        return self.process_callback(
            gateway_name=callback_payload["gateway_name"],
            gateway_order_ref=callback_payload["gateway_order_ref"],
            gateway_transaction_ref=callback_payload["gateway_transaction_ref"],
            amount=callback_payload["amount"],
            currency=callback_payload["currency"],
            status=callback_payload["status"],
            signature="provider_verified",
            ip_address=normalized_ip,
            user_agent=user_agent,
            signature_verified=True,
        )
