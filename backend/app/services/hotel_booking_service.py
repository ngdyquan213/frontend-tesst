from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    ConflictAppException,
    NotFoundAppException,
    ValidationAppException,
)
from app.models.booking import Booking, BookingItem
from app.models.enums import BookingItemType, BookingStatus, LogActorType, PaymentStatus
from app.repositories.booking_repository import BookingRepository
from app.repositories.hotel_repository import HotelRepository
from app.schemas.booking import HotelBookingCreateRequest
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService


class HotelBookingService(ApplicationService):
    def __init__(
        self,
        db: Session,
        booking_repo: BookingRepository,
        hotel_repo: HotelRepository,
        audit_service: AuditService,
    ) -> None:
        self.db = db
        self.booking_repo = booking_repo
        self.hotel_repo = hotel_repo
        self.audit_service = audit_service

    @staticmethod
    def _validate_inventory(rows, *, quantity: int) -> None:
        if any(row.available_rooms < quantity for row in rows):
            raise ValidationAppException("Not enough available rooms for the selected dates")

    @staticmethod
    def _build_booking_code(*, user_id: str, idempotency_key: str) -> str:
        digest = hashlib.sha256(f"{user_id}:{idempotency_key}".encode("utf-8")).hexdigest()
        return f"HB-{digest[:12].upper()}"

    @staticmethod
    def _build_hold_expiry(booked_at: datetime) -> datetime:
        return booked_at + timedelta(minutes=settings.BOOKING_HOLD_EXPIRE_MINUTES)

    @staticmethod
    def _assert_existing_booking_matches_request(
        *,
        booking: Booking,
        payload: HotelBookingCreateRequest,
    ) -> None:
        item = booking.items[0] if booking.items else None
        if item is None or item.item_type != BookingItemType.hotel:
            raise ConflictAppException("Idempotency key was already used for a different booking")

        if (
            str(item.hotel_room_id) != payload.hotel_room_id
            or item.check_in_date != payload.check_in_date
            or item.check_out_date != payload.check_out_date
            or item.quantity != payload.quantity
        ):
            raise ConflictAppException(
                "Idempotency key was already used with different stay details"
            )

        if (
            booking.status != BookingStatus.pending
            or booking.payment_status != PaymentStatus.pending
        ):
            raise ConflictAppException("Idempotency key was already used for a closed booking")

    def create_hotel_booking(
        self,
        *,
        user_id: str,
        payload: HotelBookingCreateRequest,
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
                room = self.hotel_repo.get_room_by_id_for_update(payload.hotel_room_id)
                if not room:
                    raise NotFoundAppException("Hotel room not found")

                nights = (payload.check_out_date - payload.check_in_date).days
                if nights <= 0:
                    raise ValidationAppException("Invalid stay duration")

                inventory_rows = self.hotel_repo.ensure_room_inventory_rows(
                    room=room,
                    check_in_date=payload.check_in_date,
                    check_out_date=payload.check_out_date,
                )
                self._validate_inventory(inventory_rows, quantity=payload.quantity)

                unit_price = Decimal(room.base_price_per_night)
                total_price = unit_price * payload.quantity * nights

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
                    item_type=BookingItemType.hotel,
                    hotel_room_id=room.id,
                    check_in_date=payload.check_in_date,
                    check_out_date=payload.check_out_date,
                    quantity=payload.quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                    metadata_json={
                        "nights": nights,
                        "room_type": room.room_type,
                    },
                )
                self.booking_repo.add_booking_item(item)

                for inventory in inventory_rows:
                    inventory.available_rooms -= payload.quantity
                    self.hotel_repo.save_room_inventory(inventory)

                self.audit_service.log_action(
                    actor_type=LogActorType.user,
                    actor_user_id=booking.user_id,
                    action="hotel_booking_created",
                    resource_type="booking",
                    resource_id=booking.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "hotel_room_id": str(room.id),
                        "quantity": payload.quantity,
                        "nights": nights,
                        "total_price": str(total_price),
                        "check_in_date": payload.check_in_date.isoformat(),
                        "check_out_date": payload.check_out_date.isoformat(),
                        "idempotency_key": idempotency_key,
                    },
                )
        except IntegrityError:
            self.db.rollback()
            existing_booking = self.booking_repo.get_by_booking_code_and_user_id(
                booking_code,
                user_id,
            )
            if existing_booking is None:
                raise
            self._assert_existing_booking_matches_request(booking=existing_booking, payload=payload)
            return existing_booking

        self.commit_and_refresh(booking)
        return booking
