from __future__ import annotations

from collections import Counter

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundAppException, ValidationAppException
from app.models.booking import Traveler
from app.models.enums import BookingItemType, LogActorType
from app.repositories.booking_repository import BookingRepository
from app.schemas.traveler import TravelerCreateRequest
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.utils.enums import enum_to_str


class TravelerService(ApplicationService):
    def __init__(
        self,
        db: Session,
        booking_repo: BookingRepository,
        audit_service: AuditService,
    ) -> None:
        self.db = db
        self.booking_repo = booking_repo
        self.audit_service = audit_service

    def _get_expected_tour_counts(self, booking) -> dict[str, int]:
        if not booking.items:
            raise ValidationAppException("Booking has no items")

        if len(booking.items) != 1:
            raise ValidationAppException(
                "Traveler management currently supports single-item booking only"
            )

        item = booking.items[0]
        if item.item_type != BookingItemType.tour:
            raise ValidationAppException("Travelers can only be managed for tour bookings")

        metadata = item.metadata_json or {}
        return {
            "adult": int(metadata.get("adult_count", 0)),
            "child": int(metadata.get("child_count", 0)),
            "infant": int(metadata.get("infant_count", 0)),
        }

    def list_travelers(
        self,
        *,
        booking_id: str,
        user_id: str,
    ) -> list[Traveler]:
        booking = self.booking_repo.get_by_id_and_user_id(booking_id, user_id)
        if not booking:
            raise NotFoundAppException("Booking not found")
        return booking.travelers

    def add_traveler(
        self,
        *,
        booking_id: str,
        user_id: str,
        payload: TravelerCreateRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Traveler:
        with self.db.begin_nested():
            booking = self.booking_repo.get_by_id_and_user_id_for_update(booking_id, user_id)
            if not booking:
                raise NotFoundAppException("Booking not found")

            expected_counts = self._get_expected_tour_counts(booking)
            current_counts = Counter(enum_to_str(t.traveler_type) for t in booking.travelers)
            traveler_type = payload.traveler_type

            if current_counts[traveler_type.value] >= expected_counts[traveler_type.value]:
                raise ValidationAppException(
                    f"Traveler count exceeded for type: {traveler_type.value}"
                )

            traveler = Traveler(
                booking_id=booking.id,
                full_name=payload.full_name,
                traveler_type=traveler_type,
                date_of_birth=payload.date_of_birth,
                passport_number=payload.passport_number,
                nationality=payload.nationality,
                document_type=payload.document_type,
            )
            self.booking_repo.add_traveler(traveler)

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=booking.user_id,
                action="traveler_added",
                resource_type="traveler",
                resource_id=traveler.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "booking_id": str(booking.id),
                    "traveler_type": traveler_type.value,
                    "full_name": payload.full_name,
                },
            )

        self.commit_and_refresh(traveler)
        return traveler
