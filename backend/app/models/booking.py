from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    DocumentType,
    PaymentStatus,
    TravelerType,
)

if TYPE_CHECKING:
    from app.models.coupon import Coupon, CouponUsage
    from app.models.document import UploadedDocument
    from app.models.flight import Flight
    from app.models.hotel import HotelRoom
    from app.models.payment import Payment
    from app.models.tour import TourSchedule
    from app.models.user import User


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"
    __table_args__ = (
        Index("idx_bookings_user_id", "user_id"),
        Index("idx_bookings_status", "status"),
        Index("idx_bookings_booking_code", "booking_code"),
        Index("idx_bookings_payment_status", "payment_status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status", native_enum=False),
        nullable=False,
        default=BookingStatus.pending,
    )

    total_base_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    total_discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    total_final_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="VND")

    coupon_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("coupons.id"),
        nullable=True,
    )

    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="booking_payment_status", native_enum=False),
        nullable=False,
        default=PaymentStatus.pending,
    )

    booked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped[User] = relationship("User", back_populates="bookings")
    coupon: Mapped[Coupon | None] = relationship("Coupon", back_populates="bookings")
    items: Mapped[list[BookingItem]] = relationship(
        "BookingItem",
        back_populates="booking",
        cascade="all, delete-orphan",
    )
    travelers: Mapped[list[Traveler]] = relationship(
        "Traveler",
        back_populates="booking",
        cascade="all, delete-orphan",
    )
    coupon_usages: Mapped[list[CouponUsage]] = relationship("CouponUsage", back_populates="booking")
    payments: Mapped[list[Payment]] = relationship(
        "Payment",
        back_populates="booking",
        cascade="all, delete-orphan",
    )
    uploaded_documents: Mapped[list[UploadedDocument]] = relationship(
        "UploadedDocument", back_populates="booking"
    )


class BookingItem(Base):
    __tablename__ = "booking_items"
    __table_args__ = (
        Index("idx_booking_items_booking_id", "booking_id"),
        Index("idx_booking_items_flight_id", "flight_id"),
        Index("idx_booking_items_hotel_room_id", "hotel_room_id"),
        Index("idx_booking_items_tour_schedule_id", "tour_schedule_id"),
        CheckConstraint("quantity > 0", name="ck_booking_items_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="ck_booking_items_unit_price_non_negative"),
        CheckConstraint("total_price >= 0", name="ck_booking_items_total_price_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
    )

    item_type: Mapped[BookingItemType] = mapped_column(
        Enum(BookingItemType, name="booking_item_type", native_enum=False),
        nullable=False,
    )

    flight_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("flights.id"),
        nullable=True,
    )
    hotel_room_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hotel_rooms.id"),
        nullable=True,
    )
    tour_schedule_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tour_schedules.id"),
        nullable=True,
    )

    check_in_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    check_out_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    booking: Mapped[Booking] = relationship("Booking", back_populates="items")
    flight: Mapped[Flight | None] = relationship("Flight", back_populates="booking_items")
    hotel_room: Mapped[HotelRoom | None] = relationship("HotelRoom", back_populates="booking_items")
    tour_schedule: Mapped["TourSchedule | None"] = relationship(
        "TourSchedule", back_populates="booking_items"
    )


class Traveler(Base):
    __tablename__ = "travelers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    traveler_type: Mapped[TravelerType] = mapped_column(
        Enum(TravelerType, name="traveler_type_for_booking", native_enum=False),
        nullable=False,
    )
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    passport_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    nationality: Mapped[str | None] = mapped_column(String(100), nullable=True)
    document_type: Mapped[DocumentType | None] = mapped_column(
        Enum(DocumentType, name="traveler_document_type", native_enum=False),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    booking: Mapped[Booking] = relationship("Booking", back_populates="travelers")
    uploaded_documents: Mapped[list["UploadedDocument"]] = relationship(
        "UploadedDocument",
        back_populates="traveler",
    )
