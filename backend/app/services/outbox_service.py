from __future__ import annotations

import logging
import os
import socket
from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import build_log_extra
from app.core.metrics import operational_metrics
from app.models.system import OutboxEvent
from app.repositories.outbox_repository import ClaimedOutboxEvent, OutboxRepository
from app.workers.email_worker import EmailWorker
from app.workers.factory import create_email_worker, create_notification_worker
from app.workers.notification_worker import NotificationWorker

logger = logging.getLogger("app.outbox")
OUTBOX_TABLE_NAME = "outbox_events"
UNDEFINED_TABLE_SQLSTATE = "42P01"


def build_outbox_processor_id() -> str:
    return f"{socket.gethostname()}:{os.getpid()}"


class OutboxService:
    def __init__(
        self,
        db: Session,
        outbox_repo: OutboxRepository | None = None,
        email_worker: EmailWorker | None = None,
        notification_worker: NotificationWorker | None = None,
        processor_id: str | None = None,
    ) -> None:
        self.db = db
        self.outbox_repo = outbox_repo or OutboxRepository(db)
        self.email_worker = email_worker
        self.notification_worker = notification_worker
        self.processor_id = processor_id or build_outbox_processor_id()

    def enqueue_email(self, *, handler: str, kwargs: dict) -> OutboxEvent:
        return self._enqueue(target="email", handler=handler, payload=kwargs)

    def enqueue_notification(self, *, handler: str, kwargs: dict) -> OutboxEvent:
        return self._enqueue(target="notification", handler=handler, payload=kwargs)

    def _enqueue(self, *, target: str, handler: str, payload: dict) -> OutboxEvent:
        event = OutboxEvent(
            target=target,
            handler=handler,
            payload=payload,
            status="pending",
            attempt_count=0,
            available_at=datetime.now(timezone.utc),
        )
        persisted_event = self.outbox_repo.add_event(event)
        backlog = self._sync_backlog_metric()
        logger.info(
            "outbox_event_enqueued",
            extra=build_log_extra(
                "outbox_event_enqueued",
                event_id=str(persisted_event.id),
                target=target,
                handler=handler,
                status=persisted_event.status,
                processor_id=self.processor_id,
                outbox_backlog=backlog,
            ),
        )
        return persisted_event

    def process_due_events(self, *, limit: int | None = None) -> int:
        batch_limit = limit or settings.OUTBOX_PROCESSING_BATCH_SIZE
        now = datetime.now(timezone.utc)
        backlog_before = self._sync_backlog_metric()
        logger.info(
            "outbox_dispatch_cycle_started",
            extra=build_log_extra(
                "outbox_dispatch_cycle_started",
                processor_id=self.processor_id,
                limit=batch_limit,
                outbox_backlog=backlog_before,
            ),
        )
        claimed_events = self.outbox_repo.claim_due_events(
            now=now,
            limit=batch_limit,
            lease_expires_at=now + timedelta(seconds=settings.OUTBOX_LEASE_SECONDS),
            claimed_by=self.processor_id,
        )

        if claimed_events:
            self.db.commit()

        processed_count = 0
        for event in claimed_events:
            try:
                self._dispatch(event)
            except Exception as exc:
                self._mark_failed(event, error_message=str(exc))
                logger.exception(
                    "outbox_event_failed",
                    extra=build_log_extra(
                        "outbox_event_failed",
                        event_id=str(event.id),
                        target=event.target,
                        handler=event.handler,
                        processor_id=self.processor_id,
                        error_message=str(exc),
                    ),
                )
            else:
                if self._mark_processed(event):
                    processed_count += 1
                    logger.info(
                        "outbox_event_processed",
                        extra=build_log_extra(
                            "outbox_event_processed",
                            event_id=str(event.id),
                            target=event.target,
                            handler=event.handler,
                            processor_id=self.processor_id,
                        ),
                    )

        backlog_after = self._sync_backlog_metric()
        logger.info(
            "outbox_dispatch_cycle_completed",
            extra=build_log_extra(
                "outbox_dispatch_cycle_completed",
                processor_id=self.processor_id,
                claimed_count=len(claimed_events),
                processed_count=processed_count,
                outbox_backlog=backlog_after,
            ),
        )

        return processed_count

    def dispatch_due_events_best_effort(self, *, limit: int | None = None) -> int:
        try:
            processed = self.process_due_events(limit=limit)
            operational_metrics.record_outbox_dispatch_result(status="success")
            return processed
        except Exception as exc:
            self.db.rollback()
            if self._is_missing_outbox_table_error(exc):
                operational_metrics.record_outbox_dispatch_result(
                    status="skipped",
                    reason="missing_table",
                )
                logger.warning(
                    "outbox_dispatch_skipped_missing_table",
                    extra=build_log_extra(
                        "outbox_dispatch_skipped_missing_table",
                        processor_id=self.processor_id,
                        table=OUTBOX_TABLE_NAME,
                        hint="run_alembic_upgrade_head",
                    ),
                )
                return 0
            operational_metrics.record_outbox_dispatch_result(
                status="failure",
                reason="dispatch_error",
            )
            logger.exception(
                "outbox_dispatch_cycle_failed",
                extra=build_log_extra(
                    "outbox_dispatch_cycle_failed",
                    processor_id=self.processor_id,
                ),
            )
            return 0

    def _dispatch(self, event: ClaimedOutboxEvent) -> None:
        worker = self._resolve_worker(event.target)
        handler = getattr(worker, event.handler, None)

        if handler is None:
            raise RuntimeError(f"Unsupported outbox handler: {event.target}.{event.handler}")

        payload = event.payload or {}
        handler(**payload)

    def _mark_processed(self, event: ClaimedOutboxEvent) -> bool:
        try:
            marked = self.outbox_repo.mark_processed(
                event_id=event.id,
                claim_token=event.claim_token,
                processed_at=datetime.now(timezone.utc),
            )
            self.db.commit()
            self._sync_backlog_metric()
            return marked
        except Exception:
            self.db.rollback()
            logger.exception(
                "outbox_finalize_processed_failed",
                extra=build_log_extra(
                    "outbox_finalize_processed_failed",
                    event_id=str(event.id),
                    processor_id=self.processor_id,
                ),
            )
            return False

    def _mark_failed(self, event: ClaimedOutboxEvent, *, error_message: str) -> bool:
        try:
            marked = self.outbox_repo.mark_failed(
                event_id=event.id,
                claim_token=event.claim_token,
                error_message=error_message,
                available_at=datetime.now(timezone.utc)
                + timedelta(seconds=min(300, 2 ** min(self._next_attempt_count(event.id), 8))),
            )
            self.db.commit()
            self._sync_backlog_metric()
            return marked
        except Exception:
            self.db.rollback()
            logger.exception(
                "outbox_finalize_failed_failed",
                extra=build_log_extra(
                    "outbox_finalize_failed_failed",
                    event_id=str(event.id),
                    processor_id=self.processor_id,
                ),
            )
            return False

    def _next_attempt_count(self, event_id) -> int:
        event = self.db.query(OutboxEvent).filter(OutboxEvent.id == event_id).one_or_none()
        if event is None:
            return 1
        return event.attempt_count + 1

    def _resolve_worker(self, target: str):
        if target == "email":
            if self.email_worker is None:
                raise RuntimeError("Email worker is not configured")
            return self.email_worker

        if target == "notification":
            if self.notification_worker is None:
                raise RuntimeError("Notification worker is not configured")
            return self.notification_worker

        raise RuntimeError(f"Unsupported outbox target: {target}")

    @staticmethod
    def _is_missing_outbox_table_error(exc: Exception) -> bool:
        if not isinstance(exc, ProgrammingError):
            return False

        original_error = getattr(exc, "orig", None)
        sqlstate = getattr(original_error, "pgcode", None)
        if sqlstate == UNDEFINED_TABLE_SQLSTATE:
            return OUTBOX_TABLE_NAME in str(original_error)

        message = str(exc).lower()
        return OUTBOX_TABLE_NAME in message and "does not exist" in message

    def get_backlog_count(self) -> int:
        backlog = self.outbox_repo.count_backlog()
        operational_metrics.set_outbox_backlog(backlog)
        return backlog

    def _sync_backlog_metric(self) -> int:
        try:
            return self.get_backlog_count()
        except Exception:
            return 0


def process_outbox_events(db: Session, *, limit: int | None = None) -> int:
    service = OutboxService(
        db=db,
        email_worker=create_email_worker(),
        notification_worker=create_notification_worker(),
    )
    return service.dispatch_due_events_best_effort(limit=limit)
