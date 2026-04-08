from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.exc import ProgrammingError

from app.core.metrics import operational_metrics
from app.models.system import OutboxEvent
from app.services.outbox_service import OutboxService
from app.workers.email_worker import EmailWorker
from app.workers.notification_worker import NotificationWorker


@pytest.fixture(autouse=True)
def clear_outbox_events(db_session):
    db_session.query(OutboxEvent).delete()
    db_session.commit()
    operational_metrics.reset()
    yield


def test_process_due_events_marks_event_processed(db_session, monkeypatch):
    sent = {"count": 0}
    email_worker = EmailWorker()

    def send_welcome_email(**kwargs):
        sent["count"] += 1

    monkeypatch.setattr(email_worker, "send_welcome_email", send_welcome_email)

    event = OutboxEvent(
        target="email",
        handler="send_welcome_email",
        payload={"to_email": "user@example.com", "full_name": "User"},
        status="pending",
        attempt_count=0,
        available_at=datetime.now(timezone.utc) - timedelta(seconds=1),
    )
    db_session.add(event)
    db_session.commit()

    service = OutboxService(
        db=db_session,
        email_worker=email_worker,
        notification_worker=NotificationWorker(),
        processor_id="test-processor",
    )

    processed_count = service.dispatch_due_events_best_effort()
    db_session.refresh(event)

    assert processed_count == 1
    assert sent["count"] == 1
    assert event.status == "processed"
    assert event.claim_token is None
    assert event.claimed_by is None
    assert event.lease_expires_at is None
    assert operational_metrics.snapshot()["outbox_last_dispatch_status"] == "success"


def test_process_due_events_reclaims_expired_processing_event(db_session, monkeypatch):
    sent = {"count": 0}
    email_worker = EmailWorker()

    def send_welcome_email(**kwargs):
        sent["count"] += 1

    monkeypatch.setattr(email_worker, "send_welcome_email", send_welcome_email)

    event = OutboxEvent(
        target="email",
        handler="send_welcome_email",
        payload={"to_email": "user@example.com", "full_name": "User"},
        status="processing",
        attempt_count=0,
        claim_token="stale-token",
        claimed_by="dead-worker",
        processing_started_at=datetime.now(timezone.utc) - timedelta(minutes=2),
        lease_expires_at=datetime.now(timezone.utc) - timedelta(seconds=5),
        available_at=datetime.now(timezone.utc) - timedelta(minutes=2),
    )
    db_session.add(event)
    db_session.commit()

    service = OutboxService(
        db=db_session,
        email_worker=email_worker,
        notification_worker=NotificationWorker(),
        processor_id="reclaimer",
    )

    processed_count = service.process_due_events()
    db_session.refresh(event)

    assert processed_count == 1
    assert sent["count"] == 1
    assert event.status == "processed"
    assert event.claim_token is None
    assert event.claimed_by is None


def test_process_due_events_skips_unexpired_processing_event(db_session, monkeypatch):
    sent = {"count": 0}
    email_worker = EmailWorker()

    def send_welcome_email(**kwargs):
        sent["count"] += 1

    monkeypatch.setattr(email_worker, "send_welcome_email", send_welcome_email)

    event = OutboxEvent(
        target="email",
        handler="send_welcome_email",
        payload={"to_email": "user@example.com", "full_name": "User"},
        status="processing",
        attempt_count=0,
        claim_token="live-token",
        claimed_by="alive-worker",
        processing_started_at=datetime.now(timezone.utc) - timedelta(seconds=5),
        lease_expires_at=datetime.now(timezone.utc) + timedelta(minutes=1),
        available_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )
    db_session.add(event)
    db_session.commit()

    service = OutboxService(
        db=db_session,
        email_worker=email_worker,
        notification_worker=NotificationWorker(),
        processor_id="other-worker",
    )

    processed_count = service.process_due_events()
    db_session.refresh(event)

    assert processed_count == 0
    assert sent["count"] == 0
    assert event.status == "processing"
    assert event.claim_token == "live-token"


def test_dispatch_due_events_best_effort_skips_missing_outbox_table():
    class FakeDatabaseSession:
        def __init__(self) -> None:
            self.rollback_called = False

        def rollback(self) -> None:
            self.rollback_called = True

    class FakeUndefinedTableError(Exception):
        pgcode = "42P01"

        def __str__(self) -> str:
            return 'relation "outbox_events" does not exist'

    service = OutboxService(
        db=FakeDatabaseSession(),
        email_worker=EmailWorker(),
        notification_worker=NotificationWorker(),
        processor_id="startup-check",
    )
    warnings: list[str] = []

    def raise_missing_table(*, limit=None):
        raise ProgrammingError("SELECT * FROM outbox_events", {}, FakeUndefinedTableError())

    def capture_warning(message, *args, **kwargs):
        extra = kwargs.get("extra")
        rendered = message % args if args else message
        if extra and isinstance(extra, dict):
            rendered = f"{rendered} {extra}"
        warnings.append(rendered)

    service.process_due_events = raise_missing_table
    service_logger = logging.getLogger("app.outbox")
    original_warning = service_logger.warning

    try:
        service_logger.warning = capture_warning
        processed_count = service.dispatch_due_events_best_effort()
    finally:
        service_logger.warning = original_warning

    assert processed_count == 0
    assert service.db.rollback_called is True
    joined_warnings = " ".join(warnings)
    assert "outbox_dispatch_skipped_missing_table" in joined_warnings
    assert "run_alembic_upgrade_head" in joined_warnings
    assert operational_metrics.snapshot()["outbox_last_dispatch_status"] == "skipped"
    assert operational_metrics.snapshot()["outbox_dispatch_failures_by_reason"] == {
        "missing_table": 1
    }
