from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constants import BOOKABLE_FLIGHT_STATUSES
from app.core.config import settings
from app.core.exceptions import ConflictAppException, NotFoundAppException, ValidationAppException
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

    @staticmethod
    def _build_booking_code(*, user_id: str, idempotency_key: str) -> str:
        digest = hashlib.sha256(f"{user_id}:{idempotency_key}".encode("utf-8")).hexdigest()
        return f"BK-{digest[:12].upper()}"

    @staticmethod
    def _build_hold_expiry(booked_at: datetime) -> datetime:
        return booked_at + timedelta(minutes=settings.BOOKING_HOLD_EXPIRE_MINUTES)

    @staticmethod
    def _assert_existing_booking_matches_request(*, booking: Booking, payload: BookingCreateRequest) -> None:
        item = booking.items[0] if booking.items else None
        if item is None or item.item_type != BookingItemType.flight or str(item.flight_id) != payload.flight_id:
            raise ConflictAppException("Idempotency key was already used for a different booking")

        if item.quantity != payload.quantity:
            raise ConflictAppException("Idempotency key was already used with a different quantity")

        if booking.status != BookingStatus.pending or booking.payment_status != PaymentStatus.pending:
            raise ConflictAppException("Idempotency key was already used for a closed booking")

    def create_booking(
        self,
        *,
        user_id: str,
        payload: BookingCreateRequest,
        idempotency_key: str | None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Booking:
        if not idempotency_key:
            raise ValidationAppException("Idempotency key is required")

        booking_code = self._build_booking_code(user_id=user_id, idempotency_key=idempotency_key)
        existing_booking = self.booking_repo.get_by_booking_code_and_user_id(booking_code, user_id)
        if existing_booking is not None:
            self._assert_existing_booking_matches_request(booking=existing_booking, payload=payload)
            return existing_booking

        booked_at = datetime.now(timezone.utc)

        try:
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
                    booking_code=booking_code,
                    user_id=user_id,
                    status=BookingStatus.pending,
                    total_base_amount=total_price,
                    total_discount_amount=Decimal("0.00"),
                    total_final_amount=total_price,
                    currency="VND",
                    payment_status=PaymentStatus.pending,
                    booked_at=booked_at,
                    expires_at=self._build_hold_expiry(booked_at),
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
                        "idempotency_key": idempotency_key,
                    },
                )

                self.db.flush()
        except IntegrityError:
            self.db.rollback()
            existing_booking = self.booking_repo.get_by_booking_code_and_user_id(booking_code, user_id)
            if existing_booking is None:
                raise
            self._assert_existing_booking_matches_request(booking=existing_booking, payload=payload)
            return existing_booking

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

    def get_my_booking(self, user_id: str, booking_id: str) -> Booking:
        booking = self.booking_repo.get_by_id_and_user_id(booking_id, user_id)
        if not booking:
            raise NotFoundAppException("Booking not found")
        return booking
