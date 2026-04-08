from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.booking import BookingItem


class Airline(Base):
    __tablename__ = "airlines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    flights: Mapped[list[Flight]] = relationship("Flight", back_populates="airline")


class Airport(Base):
    __tablename__ = "airports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    departures: Mapped[list[Flight]] = relationship(
        "Flight",
        back_populates="departure_airport",
        foreign_keys="Flight.departure_airport_id",
    )
    arrivals: Mapped[list[Flight]] = relationship(
        "Flight",
        back_populates="arrival_airport",
        foreign_keys="Flight.arrival_airport_id",
    )


class Flight(Base, TimestampMixin):
    __tablename__ = "flights"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    airline_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("airlines.id"), nullable=False
    )
    flight_number: Mapped[str] = mapped_column(String(50), nullable=False)

    departure_airport_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("airports.id"),
        nullable=False,
    )
    arrival_airport_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("airports.id"),
        nullable=False,
    )

    departure_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    arrival_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    available_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="scheduled")

    airline: Mapped[Airline] = relationship("Airline", back_populates="flights")
    departure_airport: Mapped[Airport] = relationship(
        "Airport",
        back_populates="departures",
        foreign_keys=[departure_airport_id],
    )
    arrival_airport: Mapped[Airport] = relationship(
        "Airport",
        back_populates="arrivals",
        foreign_keys=[arrival_airport_id],
    )
    booking_items: Mapped[list[BookingItem]] = relationship("BookingItem", back_populates="flight")
