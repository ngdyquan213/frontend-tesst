from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictAppException, NotFoundAppException, ValidationAppException
from app.models.booking import Booking, BookingItem
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    LogActorType,
    PaymentStatus,
    TourScheduleStatus,
    TravelerType,
)
from app.repositories.booking_repository import BookingRepository
from app.repositories.tour_repository import TourRepository
from app.schemas.booking import TourBookingCreateRequest
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.services.outbox_service import OutboxService
from app.workers.email_worker import EmailWorker
from app.workers.notification_worker import NotificationWorker


class TourBookingService(ApplicationService):
    def __init__(
        self,
        db: Session,
        booking_repo: BookingRepository,
        tour_repo: TourRepository,
        audit_service: AuditService,
        email_worker: EmailWorker,
        notification_worker: NotificationWorker,
        outbox_service: OutboxService | None = None,
    ) -> None:
        self.db = db
        self.booking_repo = booking_repo
        self.tour_repo = tour_repo
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
        return f"TB-{digest[:12].upper()}"

    @staticmethod
    def _build_hold_expiry(booked_at: datetime) -> datetime:
        return booked_at + timedelta(minutes=settings.BOOKING_HOLD_EXPIRE_MINUTES)

    @staticmethod
    def _assert_existing_booking_matches_request(*, booking: Booking, payload: TourBookingCreateRequest) -> None:
        item = booking.items[0] if booking.items else None
        metadata = item.metadata_json if item and item.metadata_json else {}

        if item is None or item.item_type != BookingItemType.tour:
            raise ConflictAppException("Idempotency key was already used for a different booking")

        expected_travelers = payload.adult_count + payload.child_count + payload.infant_count
        if (
            str(item.tour_schedule_id) != payload.tour_schedule_id
            or item.quantity != expected_travelers
            or int(metadata.get("adult_count", 0)) != payload.adult_count
            or int(metadata.get("child_count", 0)) != payload.child_count
            or int(metadata.get("infant_count", 0)) != payload.infant_count
        ):
            raise ConflictAppException(
                "Idempotency key was already used with different traveler details"
            )

        if booking.status != BookingStatus.pending or booking.payment_status != PaymentStatus.pending:
            raise ConflictAppException("Idempotency key was already used for a closed booking")

    def create_tour_booking(
        self,
        *,
        user_id: str,
        user_email: str | None,
        user_full_name: str | None,
        payload: TourBookingCreateRequest,
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
                schedule = self.tour_repo.get_schedule_by_id_for_update(payload.tour_schedule_id)
                if not schedule:
                    raise NotFoundAppException("Tour schedule not found")

                if schedule.status != TourScheduleStatus.scheduled:
                    raise ValidationAppException("Tour schedule is not bookable")

                total_travelers = payload.adult_count + payload.child_count + payload.infant_count
                if schedule.available_slots < total_travelers:
                    raise ValidationAppException("Not enough available slots")

                price_map = {rule.traveler_type: Decimal(rule.price) for rule in schedule.price_rules}

                adult_price = price_map.get(TravelerType.adult)
                if adult_price is None:
                    raise ValidationAppException("Adult pricing is missing for this tour schedule")

                child_price = price_map.get(TravelerType.child, Decimal("0.00"))
                infant_price = price_map.get(TravelerType.infant, Decimal("0.00"))

                total_price = (
                    adult_price * payload.adult_count
                    + child_price * payload.child_count
                    + infant_price * payload.infant_count
                )

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

                item = BookingItem(
                    booking_id=booking.id,
                    item_type=BookingItemType.tour,
                    tour_schedule_id=schedule.id,
                    quantity=total_travelers,
                    unit_price=total_price,
                    total_price=total_price,
                    metadata_json={
                        "adult_count": payload.adult_count,
                        "child_count": payload.child_count,
                        "infant_count": payload.infant_count,
                        "tour_id": str(schedule.tour_id),
                        "departure_date": schedule.departure_date.isoformat(),
                        "return_date": schedule.return_date.isoformat(),
                    },
                )
                self.booking_repo.add_booking_item(item)

                schedule.available_slots -= total_travelers
                self.db.add(schedule)
                self.db.flush()

                self.audit_service.log_action(
                    actor_type=LogActorType.user,
                    actor_user_id=booking.user_id,
                    action="tour_booking_created",
                    resource_type="booking",
                    resource_id=booking.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "tour_schedule_id": str(schedule.id),
                        "tour_id": str(schedule.tour_id),
                        "adult_count": payload.adult_count,
                        "child_count": payload.child_count,
                        "infant_count": payload.infant_count,
                        "total_travelers": total_travelers,
                        "total_price": str(total_price),
                        "idempotency_key": idempotency_key,
                    },
                )
        except IntegrityError:
            self.db.rollback()
            existing_booking = self.booking_repo.get_by_booking_code_and_user_id(booking_code, user_id)
            if existing_booking is None:
                raise
            self._assert_existing_booking_matches_request(booking=existing_booking, payload=payload)
            return existing_booking

        if user_email and user_full_name:
            self.outbox_service.enqueue_email(
                handler="send_booking_created_email",
                kwargs={
                    "to_email": user_email,
                    "full_name": user_full_name,
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
