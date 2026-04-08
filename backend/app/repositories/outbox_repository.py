from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.models.system import OutboxEvent


@dataclass(frozen=True, slots=True)
class ClaimedOutboxEvent:
    id: uuid.UUID
    target: str
    handler: str
    payload: dict
    claim_token: str


class OutboxRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add_event(self, event: OutboxEvent) -> OutboxEvent:
        self.db.add(event)
        self.db.flush()
        return event

    def claim_due_events(
        self,
        *,
        now: datetime,
        limit: int,
        lease_expires_at: datetime,
        claimed_by: str,
    ) -> list[ClaimedOutboxEvent]:
        events = (
            self.db.query(OutboxEvent)
            .filter(
                or_(
                    and_(
                        OutboxEvent.status.in_(("pending", "failed")),
                        OutboxEvent.available_at <= now,
                    ),
                    and_(
                        OutboxEvent.status == "processing",
                        OutboxEvent.lease_expires_at.is_not(None),
                        OutboxEvent.lease_expires_at <= now,
                    ),
                )
            )
            .order_by(OutboxEvent.available_at.asc(), OutboxEvent.created_at.asc())
            .with_for_update(skip_locked=True)
            .limit(limit)
            .all()
        )

        claimed_events: list[ClaimedOutboxEvent] = []
        for event in events:
            claim_token = uuid.uuid4().hex
            event.status = "processing"
            event.claim_token = claim_token
            event.claimed_by = claimed_by
            event.processing_started_at = now
            event.lease_expires_at = lease_expires_at
            claimed_events.append(
                ClaimedOutboxEvent(
                    id=event.id,
                    target=event.target,
                    handler=event.handler,
                    payload=event.payload,
                    claim_token=claim_token,
                )
            )

        if events:
            self.db.flush()

        return claimed_events

    def mark_processed(
        self,
        *,
        event_id: uuid.UUID,
        claim_token: str,
        processed_at: datetime,
    ) -> bool:
        event = (
            self.db.query(OutboxEvent)
            .filter(
                OutboxEvent.id == event_id,
                OutboxEvent.status == "processing",
                OutboxEvent.claim_token == claim_token,
            )
            .one_or_none()
        )
        if event is None:
            return False

        event.status = "processed"
        event.processed_at = processed_at
        event.last_error = None
        event.claim_token = None
        event.claimed_by = None
        event.processing_started_at = None
        event.lease_expires_at = None
        self.db.flush()
        return True

    def mark_failed(
        self,
        *,
        event_id: uuid.UUID,
        claim_token: str,
        error_message: str,
        available_at: datetime,
    ) -> bool:
        event = (
            self.db.query(OutboxEvent)
            .filter(
                OutboxEvent.id == event_id,
                OutboxEvent.status == "processing",
                OutboxEvent.claim_token == claim_token,
            )
            .one_or_none()
        )
        if event is None:
            return False

        event.status = "failed"
        event.attempt_count += 1
        event.last_error = error_message
        event.available_at = available_at
        event.claim_token = None
        event.claimed_by = None
        event.processing_started_at = None
        event.lease_expires_at = None
        self.db.flush()
        return True

    def count_backlog(self) -> int:
        return (
            self.db.query(func.count(OutboxEvent.id))
            .filter(OutboxEvent.status != "processed")
            .scalar()
            or 0
        )
