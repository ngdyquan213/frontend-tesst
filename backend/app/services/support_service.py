from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundAppException, ValidationAppException
from app.models.enums import LogActorType
from app.models.support import SupportTicket
from app.models.support_reply import SupportTicketReply
from app.repositories.booking_repository import BookingRepository
from app.repositories.support_repository import SupportRepository
from app.schemas.support import CreateSupportTicketRequest
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.utils.ip_utils import normalize_ip

SUPPORT_FULL_NAME_MIN_LENGTH = 2
SUPPORT_SUBJECT_MIN_LENGTH = 8
SUPPORT_MESSAGE_MIN_LENGTH = 24
SUPPORT_REPLY_MIN_LENGTH = 4
SUPPORT_TICKET_STATUSES = {"open", "in_review", "waiting_for_traveler", "resolved"}


class SupportService(ApplicationService):
    def __init__(
        self,
        db: Session,
        support_repo: SupportRepository,
        booking_repo: BookingRepository,
        audit_service: AuditService,
    ) -> None:
        self.db = db
        self.support_repo = support_repo
        self.booking_repo = booking_repo
        self.audit_service = audit_service

    def list_tickets_for_user(self, *, user_id: str, skip: int, limit: int) -> list[SupportTicket]:
        return self.support_repo.list_tickets_for_user(user_id=user_id, skip=skip, limit=limit)

    def count_tickets_for_user(self, *, user_id: str) -> int:
        return self.support_repo.count_tickets_for_user(user_id=user_id)

    def get_ticket_for_user(self, *, ticket_id: str, user_id: str) -> SupportTicket:
        ticket = self.support_repo.get_ticket_by_id_for_user(ticket_id=ticket_id, user_id=user_id)
        if not ticket:
            raise NotFoundAppException("Support ticket not found")
        return ticket

    def create_ticket(
        self,
        *,
        user_id: str,
        authenticated_email: str | None,
        authenticated_full_name: str | None,
        payload: CreateSupportTicketRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> SupportTicket:
        fallback_full_name = payload.full_name.strip()
        fallback_email = payload.email.strip()
        full_name = (authenticated_full_name or fallback_full_name).strip()
        email = (authenticated_email or fallback_email).strip()
        topic_id = payload.topic_id.strip()
        subject = payload.subject.strip()
        message = payload.message.strip()
        booking_reference = payload.booking_reference.strip() if payload.booking_reference else None

        if len(full_name) < SUPPORT_FULL_NAME_MIN_LENGTH:
            raise ValidationAppException("Full name is too short")
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValidationAppException("A valid email address is required")
        if not topic_id:
            raise ValidationAppException("Support topic is required")
        if len(subject) < SUPPORT_SUBJECT_MIN_LENGTH:
            raise ValidationAppException("Subject is too short")
        if len(message) < SUPPORT_MESSAGE_MIN_LENGTH:
            raise ValidationAppException("Message is too short")

        booking = None
        if booking_reference:
            booking = self.booking_repo.get_by_booking_code_and_user_id(booking_reference, user_id)
            if not booking:
                raise ValidationAppException("Booking reference was not found for this account")

        ticket = SupportTicket(
            reference=f"SR-{uuid4().hex[:8].upper()}",
            user_id=user_id,
            booking_id=booking.id if booking else None,
            requester_name=full_name,
            requester_email=email,
            topic_id=topic_id,
            subject=subject,
            message=message,
            status="open",
        )
        self.support_repo.add_ticket(ticket)
        self.audit_service.log_action(
            actor_type=LogActorType.user,
            actor_user_id=user_id,
            action="support_ticket_created",
            resource_type="support_ticket",
            resource_id=ticket.id,
            ip_address=normalize_ip(ip_address),
            user_agent=user_agent,
            metadata={
                "reference": ticket.reference,
                "topic_id": ticket.topic_id,
                "booking_reference": booking_reference,
                "requester_email": email,
            },
        )
        self.commit_and_refresh(ticket)
        return ticket

    def list_tickets_for_admin(
        self,
        *,
        skip: int,
        limit: int,
        status: str | None = None,
    ) -> list[SupportTicket]:
        normalized_status = self._normalize_status(status) if status else None
        return self.support_repo.list_tickets_for_admin(
            skip=skip,
            limit=limit,
            status=normalized_status,
        )

    def count_tickets_for_admin(self, *, status: str | None = None) -> int:
        normalized_status = self._normalize_status(status) if status else None
        return self.support_repo.count_tickets_for_admin(status=normalized_status)

    def get_ticket_for_admin(self, *, ticket_id: str) -> SupportTicket:
        ticket = self.support_repo.get_ticket_by_id(ticket_id=ticket_id)
        if not ticket:
            raise NotFoundAppException("Support ticket not found")
        return ticket

    def add_user_reply(
        self,
        *,
        ticket_id: str,
        user_id: str,
        author_name: str,
        message: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> SupportTicket:
        ticket = self.get_ticket_for_user(ticket_id=ticket_id, user_id=user_id)
        normalized_message = self._normalize_reply_message(message)

        reply = SupportTicketReply(
            ticket_id=ticket.id,
            author_user_id=user_id,
            author_name=author_name,
            author_role="traveler",
            message=normalized_message,
        )
        ticket.status = "open"
        ticket.updated_at = datetime.now(timezone.utc)

        self.support_repo.add_reply(reply)
        self.support_repo.save_ticket(ticket)
        self.audit_service.log_action(
            actor_type=LogActorType.user,
            actor_user_id=user_id,
            action="support_ticket_replied",
            resource_type="support_ticket",
            resource_id=ticket.id,
            ip_address=normalize_ip(ip_address),
            user_agent=user_agent,
            metadata={"reference": ticket.reference},
        )
        self.commit_and_refresh(ticket)
        return self.get_ticket_for_user(ticket_id=ticket_id, user_id=user_id)

    def add_admin_reply(
        self,
        *,
        ticket_id: str,
        admin_user_id: str,
        author_name: str,
        message: str,
        status: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> SupportTicket:
        ticket = self.get_ticket_for_admin(ticket_id=ticket_id)
        normalized_message = self._normalize_reply_message(message)
        next_status = self._normalize_status(status) if status else "waiting_for_traveler"

        reply = SupportTicketReply(
            ticket_id=ticket.id,
            author_user_id=admin_user_id,
            author_name=author_name,
            author_role="support",
            message=normalized_message,
        )
        ticket.status = next_status
        ticket.updated_at = datetime.now(timezone.utc)

        self.support_repo.add_reply(reply)
        self.support_repo.save_ticket(ticket)
        self.audit_service.log_action(
            actor_type=LogActorType.admin,
            actor_user_id=admin_user_id,
            action="admin_support_ticket_replied",
            resource_type="support_ticket",
            resource_id=ticket.id,
            ip_address=normalize_ip(ip_address),
            user_agent=user_agent,
            metadata={"reference": ticket.reference, "status": next_status},
        )
        self.commit_and_refresh(ticket)
        return self.get_ticket_for_admin(ticket_id=ticket_id)

    def update_ticket_status_for_admin(
        self,
        *,
        ticket_id: str,
        admin_user_id: str,
        status: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> SupportTicket:
        ticket = self.get_ticket_for_admin(ticket_id=ticket_id)
        normalized_status = self._normalize_status(status)
        ticket.status = normalized_status
        ticket.updated_at = datetime.now(timezone.utc)
        self.support_repo.save_ticket(ticket)
        self.audit_service.log_action(
            actor_type=LogActorType.admin,
            actor_user_id=admin_user_id,
            action="admin_support_ticket_status_updated",
            resource_type="support_ticket",
            resource_id=ticket.id,
            ip_address=normalize_ip(ip_address),
            user_agent=user_agent,
            metadata={"reference": ticket.reference, "status": normalized_status},
        )
        self.commit_and_refresh(ticket)
        return self.get_ticket_for_admin(ticket_id=ticket_id)

    def _normalize_status(self, status: str | None) -> str:
        normalized_status = (status or "").strip().lower()
        if normalized_status not in SUPPORT_TICKET_STATUSES:
            raise ValidationAppException("Invalid support ticket status")
        return normalized_status

    def _normalize_reply_message(self, message: str) -> str:
        normalized_message = message.strip()
        if len(normalized_message) < SUPPORT_REPLY_MIN_LENGTH:
            raise ValidationAppException("Reply message is too short")
        return normalized_message
