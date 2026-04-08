from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundAppException
from app.models.booking import Booking
from app.models.document import UploadedDocument
from app.models.payment import Payment
from app.models.refund import Refund
from app.models.support import SupportTicket
from app.models.system import NotificationReadState
from app.models.user import User


@dataclass(slots=True)
class NotificationItem:
    id: str
    title: str
    body: str
    type: str
    created_at: datetime


class NotificationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_user_notifications(
        self,
        *,
        current_user: User,
        limit: int = 25,
    ) -> list[dict]:
        items = self._build_user_notifications(current_user=current_user, limit=limit)
        if not items:
            return []

        read_ids = {
            item.notification_id
            for item in self.db.query(NotificationReadState)
            .filter(
                NotificationReadState.user_id == current_user.id,
                NotificationReadState.notification_id.in_([item.id for item in items]),
            )
            .all()
        }

        return [
            {
                "id": item.id,
                "title": item.title,
                "body": item.body,
                "type": item.type,
                "created_at": item.created_at,
                "read": item.id in read_ids,
            }
            for item in items
        ]

    def mark_notification_read(self, *, current_user: User, notification_id: str) -> dict:
        if not self._notification_exists_for_user(
            current_user=current_user,
            notification_id=notification_id,
        ):
            raise NotFoundAppException("Notification not found")

        state = (
            self.db.query(NotificationReadState)
            .filter(
                NotificationReadState.user_id == current_user.id,
                NotificationReadState.notification_id == notification_id,
            )
            .first()
        )

        if state is None:
            state = NotificationReadState(
                user_id=current_user.id,
                notification_id=notification_id,
                read_at=datetime.now(timezone.utc),
            )
            self.db.add(state)
            self.db.commit()

        items = self.list_user_notifications(current_user=current_user)
        notification = next((item for item in items if item["id"] == notification_id), None)
        if notification is None:
            raise NotFoundAppException("Notification not found")
        return notification

    def mark_all_notifications_read(self, *, current_user: User, limit: int = 25) -> list[dict]:
        items = self._build_user_notifications(current_user=current_user, limit=limit)
        if not items:
            return []

        existing = {
            item.notification_id
            for item in self.db.query(NotificationReadState)
            .filter(
                NotificationReadState.user_id == current_user.id,
                NotificationReadState.notification_id.in_([item.id for item in items]),
            )
            .all()
        }

        now = datetime.now(timezone.utc)
        new_states = [
            NotificationReadState(
                user_id=current_user.id,
                notification_id=item.id,
                read_at=now,
            )
            for item in items
            if item.id not in existing
        ]

        if new_states:
            self.db.add_all(new_states)
            self.db.commit()

        return [
            {
                "id": item.id,
                "title": item.title,
                "body": item.body,
                "type": item.type,
                "created_at": item.created_at,
                "read": True,
            }
            for item in items
        ]

    def _build_user_notifications(
        self,
        *,
        current_user: User,
        limit: int,
    ) -> list[NotificationItem]:
        booking_items = [
            NotificationItem(
                id=f"booking-{booking.id}",
                title=(
                    f"Booking {booking.booking_code} confirmed"
                    if str(booking.status.value).lower() == "confirmed"
                    else f"Booking {booking.booking_code} is {str(booking.status.value).lower()}"
                ),
                body=(
                    "Your booking is saved and waiting for payment to be connected."
                    if str(booking.payment_status.value).lower() == "pending"
                    else f"Current payment status: {str(booking.payment_status.value).lower()}."
                ),
                type="booking",
                created_at=booking.created_at,
            )
            for booking in self.db.query(Booking)
            .filter(Booking.user_id == current_user.id)
            .order_by(Booking.created_at.desc())
            .limit(limit)
            .all()
        ]

        document_items = [
            NotificationItem(
                id=f"document-{document.id}",
                title=f"{document.document_type.value.replace('_', ' ')} uploaded",
                body=(
                    "Your document was approved."
                    if document.status == "approved"
                    else "Your document was rejected and needs attention."
                    if document.status == "rejected"
                    else "Your document is now on file and waiting for review if needed."
                ),
                type="document",
                created_at=document.uploaded_at,
            )
            for document in self.db.query(UploadedDocument)
            .filter(
                UploadedDocument.user_id == current_user.id,
                UploadedDocument.deleted_at.is_(None),
            )
            .order_by(UploadedDocument.uploaded_at.desc())
            .limit(limit)
            .all()
        ]

        refund_items = [
            NotificationItem(
                id=f"refund-{refund.id}",
                title=f"Refund {refund.id} is {str(refund.status.value).lower()}",
                body=refund.reason or "A refund update is available for one of your bookings.",
                type="refund",
                created_at=refund.created_at,
            )
            for refund in self.db.query(Refund)
            .join(Payment, Refund.payment_id == Payment.id)
            .join(Booking, Payment.booking_id == Booking.id)
            .filter(Booking.user_id == current_user.id)
            .order_by(Refund.created_at.desc())
            .limit(limit)
            .all()
        ]

        support_items = [
            NotificationItem(
                id=f"support-{ticket.id}",
                title=f"Support ticket {ticket.reference} updated",
                body=f"{ticket.subject} ({ticket.status.replace('_', ' ')})",
                type="support",
                created_at=ticket.updated_at,
            )
            for ticket in self.db.query(SupportTicket)
            .filter(SupportTicket.user_id == current_user.id)
            .order_by(SupportTicket.updated_at.desc())
            .limit(limit)
            .all()
        ]

        all_items = booking_items + document_items + refund_items + support_items
        all_items.sort(key=lambda item: item.created_at, reverse=True)
        return all_items[:limit]

    def _notification_exists_for_user(self, *, current_user: User, notification_id: str) -> bool:
        prefix, separator, raw_id = notification_id.partition("-")
        if separator != "-" or not raw_id:
            return False

        try:
            parsed_id = uuid.UUID(raw_id)
        except ValueError:
            return False

        if prefix == "booking":
            return (
                self.db.query(Booking)
                .filter(Booking.id == parsed_id, Booking.user_id == current_user.id)
                .first()
                is not None
            )
        if prefix == "document":
            return (
                self.db.query(UploadedDocument)
                .filter(
                    UploadedDocument.id == parsed_id,
                    UploadedDocument.user_id == current_user.id,
                    UploadedDocument.deleted_at.is_(None),
                )
                .first()
                is not None
            )
        if prefix == "refund":
            return (
                self.db.query(Refund)
                .join(Payment, Refund.payment_id == Payment.id)
                .join(Booking, Payment.booking_id == Booking.id)
                .filter(Refund.id == parsed_id, Booking.user_id == current_user.id)
                .first()
                is not None
            )
        if prefix == "support":
            return (
                self.db.query(SupportTicket)
                .filter(SupportTicket.id == parsed_id, SupportTicket.user_id == current_user.id)
                .first()
                is not None
            )
        return False
