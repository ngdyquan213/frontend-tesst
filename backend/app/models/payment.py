from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import PaymentMethod, PaymentStatus

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.refund import Refund
    from app.models.user import User


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"
    __table_args__ = (
        Index("idx_payments_booking_id", "booking_id"),
        Index("idx_payments_status", "status"),
        Index("idx_payments_gateway_order_ref", "gateway_order_ref"),
        Index("idx_payments_idempotency_key", "idempotency_key"),
        UniqueConstraint(
            "booking_id",
            "idempotency_key",
            name="uq_payments_booking_id_idempotency_key",
        ),
        UniqueConstraint(
            "gateway_order_ref",
            name="uq_payments_gateway_order_ref",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=True,
    )

    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method", native_enum=False),
        nullable=False,
    )
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status", native_enum=False),
        nullable=False,
        default=PaymentStatus.pending,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="VND")
    gateway_order_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    gateway_transaction_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(255), nullable=True)

    initiated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    booking: Mapped[Booking | None] = relationship("Booking", back_populates="payments")
    initiated_by_user: Mapped[User | None] = relationship(
        "User",
        back_populates="initiated_payments",
        foreign_keys=[initiated_by],
    )
    transactions: Mapped[list["PaymentTransaction"]] = relationship(
        "PaymentTransaction",
        back_populates="payment",
        cascade="all, delete-orphan",
    )
    callbacks: Mapped[list["PaymentCallback"]] = relationship(
        "PaymentCallback",
        back_populates="payment",
        cascade="all, delete-orphan",
    )

    refunds: Mapped[list["Refund"]] = relationship(
        "Refund",
        back_populates="payment",
        cascade="all, delete-orphan",
    )


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payments.id", ondelete="CASCADE"),
        nullable=False,
    )
    transaction_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="VND")
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_transaction_status", native_enum=False),
        nullable=False,
    )
    raw_response: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    payment: Mapped[Payment] = relationship("Payment", back_populates="transactions")


class PaymentCallback(Base):
    __tablename__ = "payment_callbacks"
    __table_args__ = (
        Index(
            "uq_payment_callbacks_gateway_name_transaction_ref",
            "gateway_name",
            "gateway_transaction_ref",
            unique=True,
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payments.id", ondelete="SET NULL"),
        nullable=True,
    )
    gateway_name: Mapped[str] = mapped_column(String(50), nullable=False)
    gateway_transaction_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    callback_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    signature_valid: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    processed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    source_ip: Mapped[str | None] = mapped_column(INET, nullable=True)

    payment: Mapped[Payment | None] = relationship("Payment", back_populates="callbacks")
