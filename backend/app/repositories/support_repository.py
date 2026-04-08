from sqlalchemy.orm import Session, joinedload

from app.models.support import SupportTicket
from app.models.support_reply import SupportTicketReply


class SupportRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add_ticket(self, ticket: SupportTicket) -> SupportTicket:
        self.db.add(ticket)
        self.db.flush()
        return ticket

    def save_ticket(self, ticket: SupportTicket) -> SupportTicket:
        self.db.add(ticket)
        self.db.flush()
        return ticket

    def add_reply(self, reply: SupportTicketReply) -> SupportTicketReply:
        self.db.add(reply)
        self.db.flush()
        return reply

    def list_tickets_for_user(self, *, user_id: str, skip: int, limit: int) -> list[SupportTicket]:
        return (
            self.db.query(SupportTicket)
            .options(joinedload(SupportTicket.booking), joinedload(SupportTicket.replies))
            .filter(SupportTicket.user_id == user_id)
            .order_by(SupportTicket.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_tickets_for_user(self, *, user_id: str) -> int:
        return self.db.query(SupportTicket).filter(SupportTicket.user_id == user_id).count()

    def get_ticket_by_id_for_user(self, *, ticket_id: str, user_id: str) -> SupportTicket | None:
        return (
            self.db.query(SupportTicket)
            .options(joinedload(SupportTicket.booking), joinedload(SupportTicket.replies))
            .filter(SupportTicket.id == ticket_id, SupportTicket.user_id == user_id)
            .first()
        )

    def list_tickets_for_admin(
        self,
        *,
        skip: int,
        limit: int,
        status: str | None = None,
    ) -> list[SupportTicket]:
        query = self.db.query(SupportTicket).options(
            joinedload(SupportTicket.booking),
            joinedload(SupportTicket.replies),
        )
        if status:
            query = query.filter(SupportTicket.status == status)
        return query.order_by(SupportTicket.updated_at.desc()).offset(skip).limit(limit).all()

    def count_tickets_for_admin(self, *, status: str | None = None) -> int:
        query = self.db.query(SupportTicket)
        if status:
            query = query.filter(SupportTicket.status == status)
        return query.count()

    def get_ticket_by_id(self, *, ticket_id: str) -> SupportTicket | None:
        return (
            self.db.query(SupportTicket)
            .options(joinedload(SupportTicket.booking), joinedload(SupportTicket.replies))
            .filter(SupportTicket.id == ticket_id)
            .first()
        )
