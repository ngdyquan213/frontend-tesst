from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundAppException, ValidationAppException
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

    def create_tour_booking(
        self,
        *,
        user_id: str,
        user_email: str | None,
        user_full_name: str | None,
        payload: TourBookingCreateRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Booking:
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
                booking_code=f"TB-{uuid4().hex[:10].upper()}",
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
                },
            )

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
