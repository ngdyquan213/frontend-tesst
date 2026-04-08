from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictAppException, NotFoundAppException, ValidationAppException
from app.models.enums import LogActorType, TourScheduleStatus, TourStatus
from app.models.tour import Tour, TourPriceRule, TourSchedule
from app.repositories.tour_repository import TourRepository
from app.schemas.admin_tour import (
    AdminTourCreateRequest,
    AdminTourPriceRuleCreateRequest,
    AdminTourScheduleCreateRequest,
    AdminTourScheduleUpdateRequest,
    AdminTourUpdateRequest,
)
from app.services.admin_bulk_service import AdminBulkService
from app.services.audit_service import AuditService


class AdminTourService:
    def __init__(
        self,
        *,
        db: Session,
        tour_repo: TourRepository,
        audit_service: AuditService,
        admin_bulk_service: AdminBulkService | None = None,
    ) -> None:
        self.db = db
        self.tour_repo = tour_repo
        self.audit_service = audit_service
        self.admin_bulk_service = admin_bulk_service

    def _log_action(
        self,
        *,
        actor_user_id: UUID,
        action: str,
        resource_type: str,
        ip_address: str | None,
        user_agent: str | None,
        resource_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.audit_service.log_action(
            actor_type=LogActorType.admin,
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata,
        )

    @staticmethod
    def _validate_schedule_dates(*, departure_date, return_date) -> None:
        if return_date <= departure_date:
            raise ValidationAppException("return_date must be after departure_date")

    @staticmethod
    def _validate_capacity(*, capacity: int, available_slots: int) -> None:
        if available_slots > capacity:
            raise ValidationAppException("available_slots cannot exceed capacity")

    def list_tours(
        self,
        *,
        skip: int,
        limit: int,
        page: int,
        page_size: int,
        actor_user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[list[Tour], int]:
        try:
            tours = self.tour_repo.list_tours(skip=skip, limit=limit)
            total = self.tour_repo.count_tours()
            self._log_action(
                actor_user_id=actor_user_id,
                action="admin_list_tours",
                resource_type="tour",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "page": page,
                    "page_size": page_size,
                    "result_count": len(tours),
                },
            )
            self.db.commit()
            return tours, total
        except Exception:
            self.db.rollback()
            raise

    def create_tour(
        self,
        *,
        payload: AdminTourCreateRequest,
        actor_user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Tour:
        if self.tour_repo.get_by_code(payload.code):
            raise ConflictAppException("Tour code already exists")

        try:
            with self.db.begin_nested():
                tour = Tour(
                    code=payload.code,
                    name=payload.name,
                    destination=payload.destination,
                    description=payload.description,
                    duration_days=payload.duration_days,
                    duration_nights=payload.duration_nights,
                    meeting_point=payload.meeting_point,
                    tour_type=payload.tour_type,
                    status=payload.status,
                )
                self.tour_repo.add_tour(tour)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_create_tour",
                    resource_type="tour",
                    resource_id=tour.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={"code": tour.code, "name": tour.name},
                )

            self.db.commit()
            self.db.refresh(tour)
            return tour
        except Exception:
            self.db.rollback()
            raise

    def update_tour(
        self,
        *,
        tour_id: str,
        payload: AdminTourUpdateRequest,
        actor_user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Tour:
        tour = self.tour_repo.get_by_id(tour_id)
        if not tour:
            raise NotFoundAppException("Tour not found")

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            raise ValidationAppException("No fields provided for update")

        try:
            with self.db.begin_nested():
                for field, value in update_data.items():
                    setattr(tour, field, value)

                self.tour_repo.save_tour(tour)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_update_tour",
                    resource_type="tour",
                    resource_id=tour.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={"updated_fields": list(update_data.keys())},
                )

            self.db.commit()
            self.db.refresh(tour)
            return tour
        except Exception:
            self.db.rollback()
            raise

    def deactivate_tour(
        self,
        *,
        tour_id: str,
        actor_user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Tour:
        tour = self.tour_repo.get_by_id(tour_id)
        if not tour:
            raise NotFoundAppException("Tour not found")

        try:
            with self.db.begin_nested():
                tour.status = TourStatus.inactive
                self.tour_repo.save_tour(tour)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_deactivate_tour",
                    resource_type="tour",
                    resource_id=tour.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={"code": tour.code},
                )

            self.db.commit()
            self.db.refresh(tour)
            return tour
        except Exception:
            self.db.rollback()
            raise

    def list_tour_schedules(
        self,
        *,
        tour_id: str,
        actor_user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> list[TourSchedule]:
        tour = self.tour_repo.get_by_id(tour_id)
        if not tour:
            raise NotFoundAppException("Tour not found")

        try:
            schedules = self.tour_repo.list_schedules_by_tour_id(tour_id)
            self._log_action(
                actor_user_id=actor_user_id,
                action="admin_list_tour_schedules",
                resource_type="tour_schedule",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"tour_id": tour_id, "result_count": len(schedules)},
            )
            self.db.commit()
            return schedules
        except Exception:
            self.db.rollback()
            raise

    def create_tour_schedule(
        self,
        *,
        tour_id: str,
        payload: AdminTourScheduleCreateRequest,
        actor_user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TourSchedule:
        tour = self.tour_repo.get_by_id(tour_id)
        if not tour:
            raise NotFoundAppException("Tour not found")

        self._validate_schedule_dates(
            departure_date=payload.departure_date,
            return_date=payload.return_date,
        )
        self._validate_capacity(
            capacity=payload.capacity,
            available_slots=payload.available_slots,
        )

        try:
            with self.db.begin_nested():
                schedule = TourSchedule(
                    tour_id=tour.id,
                    departure_date=payload.departure_date,
                    return_date=payload.return_date,
                    capacity=payload.capacity,
                    available_slots=payload.available_slots,
                    status=payload.status,
                )
                self.tour_repo.add_schedule(schedule)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_create_tour_schedule",
                    resource_type="tour_schedule",
                    resource_id=schedule.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={"tour_id": str(tour.id)},
                )

            self.db.commit()
            self.db.refresh(schedule)
            return schedule
        except Exception:
            self.db.rollback()
            raise

    def update_tour_schedule(
        self,
        *,
        schedule_id: str,
        payload: AdminTourScheduleUpdateRequest,
        actor_user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TourSchedule:
        schedule = self.tour_repo.get_schedule_by_id(schedule_id)
        if not schedule:
            raise NotFoundAppException("Tour schedule not found")

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            raise ValidationAppException("No fields provided for update")

        departure_date = update_data.get("departure_date", schedule.departure_date)
        return_date = update_data.get("return_date", schedule.return_date)
        capacity = update_data.get("capacity", schedule.capacity)
        available_slots = update_data.get("available_slots", schedule.available_slots)

        self._validate_schedule_dates(departure_date=departure_date, return_date=return_date)
        self._validate_capacity(capacity=capacity, available_slots=available_slots)

        try:
            with self.db.begin_nested():
                for field, value in update_data.items():
                    setattr(schedule, field, value)

                self.tour_repo.save_schedule(schedule)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_update_tour_schedule",
                    resource_type="tour_schedule",
                    resource_id=schedule.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={"updated_fields": list(update_data.keys())},
                )

            self.db.commit()
            self.db.refresh(schedule)
            return schedule
        except Exception:
            self.db.rollback()
            raise

    def deactivate_tour_schedule(
        self,
        *,
        schedule_id: str,
        actor_user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TourSchedule:
        schedule = self.tour_repo.get_schedule_by_id(schedule_id)
        if not schedule:
            raise NotFoundAppException("Tour schedule not found")

        try:
            with self.db.begin_nested():
                schedule.status = TourScheduleStatus.closed
                self.tour_repo.save_schedule(schedule)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_deactivate_tour_schedule",
                    resource_type="tour_schedule",
                    resource_id=schedule.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={"tour_id": str(schedule.tour_id)},
                )

            self.db.commit()
            self.db.refresh(schedule)
            return schedule
        except Exception:
            self.db.rollback()
            raise

    def create_tour_price_rule(
        self,
        *,
        schedule_id: str,
        payload: AdminTourPriceRuleCreateRequest,
        actor_user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TourPriceRule:
        schedule = self.tour_repo.get_schedule_by_id(schedule_id)
        if not schedule:
            raise NotFoundAppException("Tour schedule not found")

        for existing in schedule.price_rules:
            if existing.traveler_type == payload.traveler_type:
                raise ConflictAppException("Price rule for this traveler type already exists")

        try:
            with self.db.begin_nested():
                rule = TourPriceRule(
                    tour_schedule_id=schedule.id,
                    traveler_type=payload.traveler_type,
                    price=payload.price,
                    currency=payload.currency,
                )
                self.tour_repo.add_price_rule(rule)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_create_tour_price_rule",
                    resource_type="tour_price_rule",
                    resource_id=rule.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "schedule_id": schedule_id,
                        "traveler_type": payload.traveler_type,
                    },
                )

            self.db.commit()
            self.db.refresh(rule)
            return rule
        except Exception:
            self.db.rollback()
            raise

    def bulk_close_tour_schedules(
        self,
        *,
        schedule_ids: list[str],
        actor_user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> list[dict]:
        if self.admin_bulk_service is None:
            raise ValidationAppException("Bulk admin service is required")

        try:
            with self.db.begin_nested():
                raw_results = self.admin_bulk_service.bulk_close_tour_schedules(schedule_ids)
                self._log_action(
                    actor_user_id=actor_user_id,
                    action="admin_bulk_close_tour_schedules",
                    resource_type="tour_schedule",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata={
                        "requested_ids": schedule_ids,
                        "success_count": sum(1 for item in raw_results if item["success"]),
                        "failed_count": sum(1 for item in raw_results if not item["success"]),
                    },
                )

            self.db.commit()
            return raw_results
        except Exception:
            self.db.rollback()
            raise
