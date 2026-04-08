from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.support_reply import SupportTicketReply
    from app.models.user import User


class SupportTicket(Base, TimestampMixin):
    __tablename__ = "support_tickets"
    __table_args__ = (
        Index("idx_support_tickets_user_id", "user_id"),
        Index("idx_support_tickets_status", "status"),
        Index("idx_support_tickets_reference", "reference"),
        Index("idx_support_tickets_booking_id", "booking_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    booking_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="SET NULL"),
        nullable=True,
    )
    requester_name: Mapped[str] = mapped_column(String(255), nullable=False)
    requester_email: Mapped[str] = mapped_column(String(255), nullable=False)
    topic_id: Mapped[str] = mapped_column(String(100), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="open")

    user: Mapped["User"] = relationship("User", back_populates="support_tickets")
    booking: Mapped["Booking | None"] = relationship("Booking", back_populates="support_tickets")
    replies: Mapped[list["SupportTicketReply"]] = relationship(
        "SupportTicketReply",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="SupportTicketReply.created_at.asc()",
    )
