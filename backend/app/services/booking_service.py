from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.constants import BOOKABLE_FLIGHT_STATUSES
from app.core.exceptions import NotFoundAppException, ValidationAppException
from app.models.booking import Booking, BookingItem
from app.models.enums import BookingItemType, BookingStatus, LogActorType, PaymentStatus
from app.repositories.booking_repository import BookingRepository
from app.repositories.flight_repository import FlightRepository
from app.repositories.user_repository import UserRepository
from app.schemas.booking import BookingCreateRequest
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.services.outbox_service import OutboxService
from app.utils.ip_utils import normalize_ip
from app.workers.email_worker import EmailWorker
from app.workers.notification_worker import NotificationWorker


class BookingService(ApplicationService):
    def __init__(
        self,
        db: Session,
        booking_repo: BookingRepository,
        flight_repo: FlightRepository,
        user_repo: UserRepository,
        audit_service: AuditService,
        email_worker: EmailWorker,
        notification_worker: NotificationWorker,
        outbox_service: OutboxService | None = None,
    ) -> None:
        self.db = db
        self.booking_repo = booking_repo
        self.flight_repo = flight_repo
        self.user_repo = user_repo
        self.audit_service = audit_service
        self.email_worker = email_worker
        self.notification_worker = notification_worker
        self.outbox_service = outbox_service or OutboxService(
            db=db,
            email_worker=email_worker,
            notification_worker=notification_worker,
        )

    def create_booking(
        self,
        *,
        user_id: str,
        payload: BookingCreateRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Booking:
        with self.db.begin_nested():
            flight = self.flight_repo.get_by_id_for_update(payload.flight_id)
            if not flight:
                raise NotFoundAppException("Flight not found")

            if flight.status not in BOOKABLE_FLIGHT_STATUSES:
                raise ValidationAppException("Flight is not bookable")

            if flight.available_seats < payload.quantity:
                raise ValidationAppException("Not enough available seats")

            total_price = Decimal(flight.base_price) * payload.quantity

            booking = Booking(
                booking_code=f"BK-{uuid4().hex[:10].upper()}",
                user_id=user_id,
                status=BookingStatus.pending,
                total_base_amount=total_price,
                total_discount_amount=Decimal("0.00"),
                total_final_amount=total_price,
                currency="VND",
                payment_status=PaymentStatus.pending,
                booked_at=datetime.now(timezone.utc),
            )
            self.booking_repo.add_booking(booking)
            self.db.flush()

            item = BookingItem(
                booking_id=booking.id,
                item_type=BookingItemType.flight,
                flight_id=flight.id,
                quantity=payload.quantity,
                unit_price=flight.base_price,
                total_price=total_price,
            )
            self.booking_repo.add_booking_item(item)

            flight.available_seats -= payload.quantity
            self.flight_repo.save(flight)

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=booking.user_id,
                action="booking_created",
                resource_type="booking",
                resource_id=booking.id,
                ip_address=normalize_ip(ip_address),
                user_agent=user_agent,
                metadata={
                    "flight_id": str(flight.id),
                    "quantity": payload.quantity,
                    "total_price": str(total_price),
                },
            )

            self.db.flush()

        user = self.user_repo.get_by_id(str(booking.user_id))
        if user:
            self.outbox_service.enqueue_email(
                handler="send_booking_created_email",
                kwargs={
                    "to_email": user.email,
                    "full_name": user.full_name,
                    "booking_code": booking.booking_code,
                    "total_amount": str(booking.total_final_amount),
                    "currency": booking.currency,
                },
            )

        self.outbox_service.enqueue_notification(
            handler="notify_booking_created",
            kwargs={
                "user_id": str(booking.user_id),
                "booking_id": str(booking.id),
                "booking_code": booking.booking_code,
            },
        )

        self.commit_and_refresh(booking)
        return booking

    def list_my_bookings(self, user_id: str, *, skip: int = 0, limit: int = 20) -> list[Booking]:
        return self.booking_repo.list_by_user_id(user_id, skip=skip, limit=limit)

    def count_my_bookings(self, user_id: str) -> int:
        return self.booking_repo.count_by_user_id(user_id)
