from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import TourScheduleStatus, TourStatus, TravelerType

if TYPE_CHECKING:
    from app.models.booking import BookingItem


class Tour(Base, TimestampMixin):
    __tablename__ = "tours"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_nights: Mapped[int] = mapped_column(Integer, nullable=False)
    meeting_point: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tour_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[TourStatus] = mapped_column(
        Enum(TourStatus, name="tour_status", native_enum=False),
        nullable=False,
        default=TourStatus.active,
    )

    schedules: Mapped[list[TourSchedule]] = relationship(
        "TourSchedule",
        back_populates="tour",
        cascade="all, delete-orphan",
    )
    itineraries: Mapped[list[TourItinerary]] = relationship(
        "TourItinerary",
        back_populates="tour",
        cascade="all, delete-orphan",
    )
    policies: Mapped[list[TourPolicy]] = relationship(
        "TourPolicy",
        back_populates="tour",
        cascade="all, delete-orphan",
    )


class TourSchedule(Base, TimestampMixin):
    __tablename__ = "tour_schedules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tour_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tours.id", ondelete="CASCADE"),
        nullable=False,
    )
    departure_date: Mapped[date] = mapped_column(Date, nullable=False)
    return_date: Mapped[date] = mapped_column(Date, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    available_slots: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[TourScheduleStatus] = mapped_column(
        Enum(TourScheduleStatus, name="tour_schedule_status", native_enum=False),
        nullable=False,
        default=TourScheduleStatus.scheduled,
    )

    tour: Mapped[Tour] = relationship("Tour", back_populates="schedules")
    price_rules: Mapped[list[TourPriceRule]] = relationship(
        "TourPriceRule",
        back_populates="tour_schedule",
        cascade="all, delete-orphan",
    )
    booking_items: Mapped[list["BookingItem"]] = relationship(
        "BookingItem",
        back_populates="tour_schedule",
    )


class TourPriceRule(Base, TimestampMixin):
    __tablename__ = "tour_price_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tour_schedule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tour_schedules.id", ondelete="CASCADE"),
        nullable=False,
    )
    traveler_type: Mapped[TravelerType] = mapped_column(
        Enum(TravelerType, name="traveler_type", native_enum=False),
        nullable=False,
    )
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="VND")

    tour_schedule: Mapped[TourSchedule] = relationship("TourSchedule", back_populates="price_rules")


class TourItinerary(Base, TimestampMixin):
    __tablename__ = "tour_itineraries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tour_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tours.id", ondelete="CASCADE"),
        nullable=False,
    )
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    tour: Mapped[Tour] = relationship("Tour", back_populates="itineraries")


class TourPolicy(Base, TimestampMixin):
    __tablename__ = "tour_policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tour_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tours.id", ondelete="CASCADE"),
        nullable=False,
    )
    cancellation_policy: Mapped[str | None] = mapped_column(Text, nullable=True)
    refund_policy: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    tour: Mapped[Tour] = relationship("Tour", back_populates="policies")
