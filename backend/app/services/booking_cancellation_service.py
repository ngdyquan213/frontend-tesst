from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundAppException
from app.models.enums import LogActorType
from app.repositories.booking_repository import BookingRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.booking import BookingCancelRequest
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.services.booking_cancellation_domain_service import BookingCancellationDomainService
from app.services.booking_inventory_service import BookingInventoryService
from app.services.outbox_service import OutboxService
from app.workers.email_worker import EmailWorker


class BookingCancellationService(ApplicationService):
    def __init__(
        self,
        db: Session,
        booking_repo: BookingRepository,
        payment_repo: PaymentRepository,
        audit_service: AuditService,
        email_worker: EmailWorker,
        inventory_service: BookingInventoryService,
        domain_service: BookingCancellationDomainService,
        outbox_service: OutboxService | None = None,
    ) -> None:
        self.db = db
        self.booking_repo = booking_repo
        self.payment_repo = payment_repo
        self.audit_service = audit_service
        self.email_worker = email_worker
        self.inventory_service = inventory_service
        self.domain_service = domain_service
        self.outbox_service = outbox_service or OutboxService(
            db=db,
            email_worker=email_worker,
        )

    def cancel_booking(
        self,
        *,
        booking_id: str,
        user_id: str,
        payload: BookingCancelRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        booking = self.booking_repo.get_by_id_and_user_id_for_update(booking_id, user_id)
        if not booking:
            raise NotFoundAppException("Booking not found")

        self.domain_service.assert_booking_can_be_cancelled(booking)
        payment = self.payment_repo.get_latest_by_booking_id_for_update(str(booking.id))
        refund = None
        refund_amount = Decimal("0.00")

        with self.db.begin_nested():
            self.inventory_service.restore_inventory(booking)
            cancelled_at = datetime.now(timezone.utc)
            result = self.domain_service.apply_cancellation(
                booking=booking,
                payment=payment,
                reason=payload.reason,
                cancelled_at=cancelled_at,
            )

            self.booking_repo.save(booking)

            if payment and result.payment_updated:
                self.payment_repo.save(payment)

            if result.refund:
                self.payment_repo.add_refund(result.refund)

            refund = result.refund
            refund_amount = result.refund_amount

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=booking.user_id,
                action="booking_cancelled",
                resource_type="booking",
                resource_id=booking.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "booking_code": booking.booking_code,
                    "refund_amount": str(refund_amount),
                    "reason": payload.reason,
                },
            )

            if booking.user:
                self.outbox_service.enqueue_email(
                    handler="send_booking_cancelled_email",
                    kwargs={
                        "to_email": booking.user.email,
                        "full_name": booking.user.full_name,
                        "booking_code": booking.booking_code,
                        "cancellation_reason": booking.cancellation_reason,
                    },
                )

                if refund and refund.amount > 0:
                    self.outbox_service.enqueue_email(
                        handler="send_refund_processed_email",
                        kwargs={
                            "to_email": booking.user.email,
                            "full_name": booking.user.full_name,
                            "booking_code": booking.booking_code,
                            "refund_amount": str(refund.amount),
                            "currency": refund.currency,
                        },
                    )

        self.commit_and_refresh(booking, payment, refund)
        return booking, payment, refund
